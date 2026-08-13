# Comic Vault — Privacy Policy & Terms of Use (DRAFT v2)

> **⚠️ DRAFT — NOT LEGAL ADVICE, NOT YET REVIEWED BY A LAWYER.** Written
> from the site owner's own notes as a starting point for legal review
> before it is ever published or linked from the live site. Nothing below
> is final or actual legal protection until reviewed. Gitignored on
> purpose.

**Last drafted:** 2026-08-13.
**Bracketed passages `[...]` are items to confirm or fill in before publishing.**

---

## 1. What Comic Vault is

Comic Vault is a free comic-collection tracker built and run by one person
as a personal project. It is not a company, has no funding, makes no
money, and isn't promoted anywhere. It has a very small number of users,
all of whom were invited or told about it directly by the owner.

Scale your expectations of support, uptime, and resources accordingly:
there is no team, no budget, and no guarantee of continuity behind this
site.

## 2. 18+ only

Comic Vault is for people aged 18 and over. There is no moderation, no
automated reporting system, and no age verification — this is a condition
of use, not a technical control. If the owner learns that an account
belongs to a minor, that account will be deleted.

## 3. The personal information we hold

The list is short, and it's complete:

- **Your email address** (or the link to your Google account, if you sign
  in that way). Stored and managed by Supabase, our authentication
  provider.
- **Your password**, if applicable. Managed by Supabase in hashed form.
  The site owner has **no** access to it and cannot read it.
- **Your username and display name**, which you choose yourself. Nothing
  requires you to use your real name, and we recommend you don't.
- **Your profile picture (avatar)**, if you upload one. Optional.

That's it. We don't collect your legal name, address, phone number, date
of birth, or any payment information — the site is free and has no
payment system.

Your collection, lists, and favorites are data **about comic books**, not
about you. They're stored in our database, and the site owner has
technical access to them, as with any data required to operate the site.

## 4. Who can see what

- **Your lists are private by default.** No action on your part is needed
  to make them private.
- The **only** way another person can see one of your lists is if you
  invite them to it as a viewer or editor.
- Someone you invite sees **only** the comics in that list (and those
  comics' public information) plus **your username**. Nothing else: not
  your email, not your other lists, not your favorites, not your full
  collection.
- **Your favorites are never visible to anyone but you.**
- There is **no user directory** and no user search. Nobody can look you
  up on the site.
- **Your avatar** is served from a public URL whose filename is a random
  identifier unrelated to your account. It isn't searchable or listed
  anywhere, and — unlike an earlier version of this file — the link itself
  no longer doubles as a stable identifier of your account. Anyone holding
  the exact link can still view the image without being signed in.
  [Confirm avatars uploaded before this change have been re-uploaded or
  otherwise migrated off their old account-keyed filename before
  publishing.]

## 5. What we don't do

- **No profiling.** We don't build advertising profiles, infer things
  about you, or analyze your data for any purpose beyond making the
  site's own features work (search, favorites, lists, etc.).
- **No tracking.** No analytics scripts, no pixels, no ad networks.
- **No selling or commercial sharing** of your data, to anyone, for any
  reason.
- **No cookies beyond what's needed** to keep you signed in and make the
  site function (session and authentication state).
- **No unsolicited email.** The only emails you might receive are
  transactional (account confirmation, password reset) or, rarely, an
  important notice about the site itself.

## 6. Service providers and technical logs

Running the site means relying on third-party services. These aren't
partners we "sell" or "share" your data with — they're providers that
process certain data on our behalf so the site works.

- **Supabase** — authentication, database, and avatar storage.
- **Vercel** — site hosting.
- **Google** — only if you choose to sign in with your Google account.
- **ComicVine** and **UPCitemdb** — queried for metadata, cover images,
  and barcode lookups. Those queries are about comics, not about you: no
  personal information is sent to them.

These services may host or process data **outside Quebec** [specify
Supabase and Vercel hosting regions].

Separately, even with no analytics on our end, these providers keep
**technical logs** (connections, IP addresses, authentication logs). We
don't consult them for analysis, but they exist, and an IP address is
personal information. We'd rather say so than write "nothing is logged,"
which would be inaccurate.

## 7. Retention, deletion, and access to your data

- **Self-serve deletion.** The app has a "delete my account" feature that
  cascades to your account and all data referencing it, including your
  avatar file — confirmed wired into the deletion function, not just the
  database rows.
- **A copy of your data.** Email the address in Section 13 and the owner
  will send you a copy of your personal information and account contents
  in a machine-readable format (JSON or CSV).
- **Correction.** You can change your username, display name, and avatar
  directly in the app. For anything else, email us.
- **Retention.** Data is kept as long as your account exists. [Decide on
  an inactive-account policy, if any.]

## 8. If the project shuts down

This is a one-person project and it may stop existing. If the site is
taken offline:

1. Users will be notified at their account email at least **[X days]** in
   advance.
2. During that window, you can export your data or request a copy.
3. At the end of it, the Supabase project will be deleted. That deletion
   is permanent and irreversible: the database, stored files, user
   accounts, and all backups are destroyed with no possibility of
   recovery.

## 9. Accuracy of derived features

Several features (reading-order "runs," cover-image matching, search
relevance) are produced by best-effort algorithms and matching
heuristics. They aren't verified or guaranteed-correct facts: treat every
result as our best guess given the data we have. These features can be
wrong, incomplete, or occasionally nonsensical, and we don't warrant
their accuracy.

## 10. Availability of third-party-dependent features

Comic Vault relies on free tiers of public APIs (ComicVine, UPCitemdb).
Those tiers have usage limits outside our control. Features depending on
them may become slow, rate-limited, or unavailable at any time, through
no fault of the site. We don't guarantee uptime or availability for any
feature that depends on a third-party service.

## 11. Your own account security is your responsibility

We're not responsible for the consequences of your own security
practices: a weak password, a session left open on a shared device,
forgetting to sign out, or handing your session to someone else. Use a
real password and sign out on devices you don't fully control.

## 12. Acceptable use

By using Comic Vault, you agree not to:

- Attempt to break, exploit, probe for vulnerabilities in, or otherwise
  attack the site or its infrastructure.
- Circumvent, abuse, or excessively hammer the third-party APIs the site
  depends on, or cause the site to violate their terms of use.
- Upload an avatar that is illegal, hateful, sexually explicit, or that
  you don't hold the rights to. There is no moderation: the owner may
  remove an image or an account upon becoming aware of it.
- Use shared access to a list to harass the person who invited you, or to
  redistribute their list's contents elsewhere without their consent.

Violations may result in your account being suspended or removed, [at the
site owner's discretion — wording to be validated for enforceability]. To
report a problem, email the address in Section 13.

## 13. No warranty / limitation of liability

*(Placeholder — clause to be drafted by a lawyer. Notes: free
single-person project, no guarantee of uptime, accuracy, or security, use
at your own risk, no liability for data loss, breach, or service
interruption to the extent legally permitted. Check how Quebec's Consumer
Protection Act affects this kind of clause for a free service.)*

## 14. Intellectual property

The favicon and the site's interface were created by the site owner.
Comic Vault isn't trademarked and the owner makes no money from it. A
link back or a shoutout if you reference it elsewhere is appreciated but
not required.

**Cover images and metadata** displayed on the site come from third-party
databases (ComicVine, UPCitemdb) and remain the property of their
respective rights holders — publishers, creators, and data providers.
Comic Vault claims no rights in them and displays them for
collection-reference purposes. [Check ComicVine's API terms for
attribution requirements and reproduce them here if needed.]

## 15. Changes to this policy

These terms may change at any time. For material changes, users will be
notified [by email / by an in-app notice] at least [X days] before they
take effect.

## 16. Person in charge of personal information, and contact

The person in charge of the protection of personal information for Comic
Vault is **[name or title — the site owner]**, reachable at:

**comicvault.support@gmail.com**

Write to this address with any question, to exercise your rights of
access, correction, portability, or deletion, or to report another
user's behaviour.

## 17. Governing law

[Placeholder — to be determined with the lawyer. Province of Quebec,
subject to mandatory consumer-protection rules.]

---

## Open questions for the legal review

1. **Applicability.** Is Comic Vault "an enterprise" under the Civil Code
   of Quebec, and therefore subject to Law 25? No economic activity, no
   revenue, no promotion, a handful of adult users known to the owner. If
   not, which parts of this document become optional — and is it worth
   keeping them anyway?
2. **Section 13.** Is a no-warranty / limitation-of-liability clause
   enforceable for a free consumer-facing service in Quebec? Get real
   language.
3. **Account termination.** Does "at the site owner's discretion" need
   softening or framing to be enforceable?
4. **Hosting outside Quebec.** If Law 25 applies, is a privacy impact
   assessment required before sending information outside Quebec, and how
   formal must it be for a project this size?
5. **Person in charge.** Must a full legal name appear, or do a title and
   contact address suffice? (Owner's preference: not publishing his legal
   name.)
6. **Notice period** for material changes and for shutdown: what minimum?
7. **Language versions.** If both are published, which governs in case of
   conflict, and does the Charter of the French Language impose anything
   here? See `legal-draft-privacy-and-terms-fr.md` for the parallel French
   (Quebec) draft.
8. **18+.** Is a plain term of use sufficient, with no age verification,
   for a free service with no adult content?
9. **Section 4, avatar URL.** Decided: filenames are now random, decoupled
   from the account ID (was previously the account's own internal ID).
   Confirm any avatar uploaded before this change has since been
   re-uploaded — otherwise it's still sitting at its old, account-keyed
   filename — before publishing this section as written.
