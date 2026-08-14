// One-off cleanup for publisher rows created before upsertPublisher started
// normalizing regional-imprint variants ("Marvel UK", "DC Comics France")
// onto their canonical name (see normalizePublisherName in
// src/services/comicvine.ts). Finds publishers whose names fold to the same
// canonical name, merges them into one row, and reassigns everything that
// pointed at the duplicates.
//
// Plain standalone script (not TypeScript) because it runs outside Vite —
// no "@/" path aliases available — via:
//
//   node --env-file=.env.local scripts/merge-regional-publishers.mjs
//
// Defaults to a dry run (prints what it would merge, changes nothing).
// Pass --apply to actually write:
//
//   node --env-file=.env.local scripts/merge-regional-publishers.mjs --apply

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (check .env.local).");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Snapshot of PUBLISHER_NAME_ALIASES / normalizePublisherName in
// src/services/comicvine.ts at the time this script was written — kept as a
// literal copy rather than imported since this runs standalone. Only needs
// to stay in sync for as long as this one-off cleanup is still relevant;
// going forward, upsertPublisher normalizes new imports on its own.
const PUBLISHER_NAME_ALIASES = {
  " Marvel ": "Marvel",
  " Marvel Comics ": "Marvel",
  " DC Comics ": "DC Comics",
  " DC ": "DC Comics",
  " Image ": "Image",
  " Image Comics ": "Image",
  " Dark Horse Comics ": "Dark Horse Comics",
  " Dark Horse ": "Dark Horse Comics",
  " Boom! Studios ": "Boom! Studios",
  " Boom Studios ": "Boom! Studios",
  " IDW Publishing ": "IDW Publishing",
  " IDW ": "IDW Publishing",
  " DMG/Valiant Entertainment ": "DMG/Valiant Entertainment",
  " Valiant Entertainment ": "DMG/Valiant Entertainment",
  " Valiant ": "DMG/Valiant Entertainment",
  " Red 5 Comics ": "Red 5 Comics",
  " Red 5 ": "Red 5 Comics",
};

function normalizePublisherName(name) {
  const padded = ` ${name.trim()} `;
  for (const [needle, canonical] of Object.entries(PUBLISHER_NAME_ALIASES)) {
    if (padded.includes(needle)) return canonical;
  }
  return name;
}

function must(result, what) {
  if (result.error) {
    console.error(`${what} failed:`, result.error);
    throw result.error;
  }
  return result.data;
}

async function mergeFavorites(dupeId, keepId) {
  const dupeFavs = must(
    await supabase.from("favorite_publishers").select("user_id").eq("publisher_id", dupeId),
    "select favorite_publishers",
  );
  for (const { user_id } of dupeFavs ?? []) {
    const existing = must(
      await supabase
        .from("favorite_publishers")
        .select("user_id")
        .eq("publisher_id", keepId)
        .eq("user_id", user_id)
        .maybeSingle(),
      "select existing favorite_publishers row",
    );
    if (existing) {
      // User already favorited the canonical publisher too — dropping the
      // duplicate row rather than moving it would violate the
      // (user_id, publisher_id) primary key.
      must(
        await supabase
          .from("favorite_publishers")
          .delete()
          .eq("publisher_id", dupeId)
          .eq("user_id", user_id),
        "delete redundant favorite_publishers row",
      );
    } else {
      must(
        await supabase
          .from("favorite_publishers")
          .update({ publisher_id: keepId })
          .eq("publisher_id", dupeId)
          .eq("user_id", user_id),
        "repoint favorite_publishers row",
      );
    }
  }
}

async function main() {
  const apply = process.argv.includes("--apply");

  const publishers = must(
    await supabase.from("publishers").select("id, name, comicvine_id"),
    "select publishers",
  );

  const groups = new Map();
  for (const p of publishers) {
    const canonical = normalizePublisherName(p.name);
    if (!groups.has(canonical)) groups.set(canonical, []);
    groups.get(canonical).push(p);
  }

  const toMerge = [...groups.entries()].filter(([, rows]) => rows.length > 1);
  if (toMerge.length === 0) {
    console.log("No regional-variant publisher duplicates found. Nothing to do.");
    return;
  }

  let mergedGroups = 0;
  let mergedRows = 0;
  for (const [canonical, rows] of toMerge) {
    const keep = rows.find((r) => r.name === canonical) ?? rows[0];
    const dupes = rows.filter((r) => r.id !== keep.id);

    console.log(`\n"${canonical}" — keeping ${keep.id} (currently named "${keep.name}")`);
    for (const d of dupes) {
      console.log(`  merging in ${d.id} "${d.name}" (comicvine_id=${d.comicvine_id ?? "null"})`);
    }

    if (!apply) {
      mergedGroups++;
      mergedRows += dupes.length;
      continue;
    }

    if (keep.name !== canonical) {
      must(
        await supabase.from("publishers").update({ name: canonical }).eq("id", keep.id),
        `rename publisher ${keep.id} to canonical`,
      );
    }

    for (const dupe of dupes) {
      must(
        await supabase.from("series").update({ publisher_id: keep.id }).eq("publisher_id", dupe.id),
        `repoint series off ${dupe.id}`,
      );
      must(
        await supabase.from("volumes").update({ publisher_id: keep.id }).eq("publisher_id", dupe.id),
        `repoint volumes off ${dupe.id}`,
      );
      await mergeFavorites(dupe.id, keep.id);
      must(
        await supabase.from("publishers").delete().eq("id", dupe.id),
        `delete duplicate publisher ${dupe.id}`,
      );
    }

    mergedGroups++;
    mergedRows += dupes.length;
  }

  if (!apply) {
    console.log(
      `\nDry run: would merge ${mergedRows} duplicate row(s) into ${mergedGroups} canonical publisher(s).` +
        `\nRe-run with --apply to actually make these changes.`,
    );
  } else {
    console.log(`\nDone: merged ${mergedRows} duplicate row(s) into ${mergedGroups} canonical publisher(s).`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
