# Comic Vault — Politique de confidentialité et conditions d'utilisation (BROUILLON v2)

> **⚠️ BROUILLON — CECI N'EST PAS UN AVIS JURIDIQUE ET N'A PAS ENCORE ÉTÉ
> RÉVISÉ PAR UN AVOCAT.** Rédigé à partir des notes personnelles du
> propriétaire du site, comme point de départ pour une révision juridique
> avant toute publication ou tout lien depuis le site en ligne. Rien
> ci-dessous n'est final ni ne constitue une protection juridique réelle
> avant révision. Exclu du dépôt Git intentionnellement.

**Dernière rédaction :** 2026-08-13.
**Les passages entre crochets `[...]` sont à confirmer ou à compléter avant publication.**

Ce document est la version française (Québec) parallèle, section par
section, de `legal-draft-privacy-and-terms.md` (anglais). En cas d'écart
entre les deux versions, ce n'est pas voulu — signalez-le.

---

## 1. Ce qu'est Comic Vault

Comic Vault est un outil gratuit de suivi de collection de bandes
dessinées, conçu et exploité par une seule personne, à titre de projet
personnel. Ce n'est pas une entreprise, il n'y a aucun financement, aucun
revenu, et le site n'est fait la promotion nulle part. Il compte un très
petit nombre d'utilisateurs, tous invités ou informés directement par le
propriétaire.

Ajustez vos attentes de soutien, de disponibilité et de ressources en
conséquence : il n'y a ni équipe, ni budget, ni garantie de continuité
derrière ce site.

## 2. Réservé aux 18 ans et plus

Comic Vault s'adresse aux personnes de 18 ans et plus. Il n'y a aucune
modération, aucun système de signalement automatisé, et aucune
vérification d'âge — il s'agit d'une condition d'utilisation, pas d'un
contrôle technique. Si le propriétaire apprend qu'un compte appartient à
une personne mineure, ce compte sera supprimé.

## 3. Les renseignements personnels que nous détenons

La liste est courte, et elle est complète :

- **Votre adresse courriel** (ou le lien vers votre compte Google, si
  vous vous connectez ainsi). Stockée et gérée par Supabase, notre
  fournisseur d'authentification.
- **Votre mot de passe**, le cas échéant. Géré par Supabase sous forme
  hachée. Le propriétaire du site n'y a **aucun** accès et ne peut pas le
  lire.
- **Votre nom d'utilisateur et votre nom d'affichage**, que vous
  choisissez vous-même. Rien ne vous oblige à utiliser votre vrai nom, et
  nous vous recommandons de ne pas le faire.
- **Votre photo de profil (avatar)**, si vous en téléversez une.
  Optionnel.

C'est tout. Nous ne recueillons ni votre nom légal, ni votre adresse, ni
votre numéro de téléphone, ni votre date de naissance, ni aucune
information de paiement — le site est gratuit et n'a aucun système de
paiement.

Votre collection, vos listes et vos favoris sont des données **sur des
bandes dessinées**, pas sur vous. Elles sont stockées dans notre base de
données, et le propriétaire du site y a un accès technique, comme pour
toute donnée nécessaire à l'exploitation du site.

## 4. Qui peut voir quoi

- **Vos listes sont privées par défaut.** Aucune action de votre part
  n'est requise pour les garder privées.
- La **seule** façon pour une autre personne de voir une de vos listes
  est que vous l'y invitiez comme collaborateur ou collaboratrice, en
  visualisation ou en édition.
- Une personne que vous invitez ne voit **que** les bandes dessinées de
  cette liste (et l'information publique de ces bandes dessinées), ainsi
  que **votre nom d'utilisateur**. Rien d'autre : ni votre courriel, ni
  vos autres listes, ni vos favoris, ni votre collection complète.
- **Vos favoris ne sont jamais visibles par personne d'autre que vous.**
- Il n'y a **aucun répertoire d'utilisateurs** et aucune recherche
  d'utilisateurs. Personne ne peut vous chercher sur le site.
- **Votre avatar** est servi depuis une URL publique dont le nom de
  fichier est un identifiant aléatoire sans lien avec votre compte. Il
  n'est ni cherchable ni listé nulle part, et — contrairement à une
  version antérieure de ce document — le lien lui-même ne constitue plus
  un identifiant stable de votre compte. Quiconque possède le lien exact
  peut tout de même voir l'image sans être connecté. [Confirmer que les
  avatars téléversés avant ce changement ont été retéléversés ou migrés
  hors de leur ancien nom de fichier lié au compte avant publication.]

## 5. Ce que nous ne faisons pas

- **Aucun profilage.** Nous ne construisons pas de profils publicitaires,
  nous ne déduisons rien à votre sujet et nous n'analysons pas vos
  données à des fins autres que le fonctionnement des fonctionnalités du
  site (recherche, favoris, listes, etc.).
- **Aucun pistage.** Aucun script d'analytique, aucun pixel, aucun réseau
  publicitaire.
- **Aucune vente ni partage commercial** de vos données, à qui que ce
  soit, pour quelque raison que ce soit.
- **Aucun témoin (cookie)** au-delà de ce qui est nécessaire pour
  maintenir votre connexion et faire fonctionner le site (état de session
  et d'authentification).
- **Aucun courriel non sollicité.** Les seuls courriels que vous pourriez
  recevoir sont transactionnels (confirmation de compte, réinitialisation
  de mot de passe) ou, rarement, un avis important concernant le site
  lui-même.

## 6. Fournisseurs de services et journaux techniques

Faire fonctionner le site implique de recourir à des services tiers. Ce
ne sont pas des partenaires à qui nous « vendons » ou « partageons » vos
données — ce sont des fournisseurs qui traitent certaines données en
notre nom pour que le site fonctionne.

- **Supabase** — authentification, base de données et stockage des
  avatars.
- **Vercel** — hébergement du site.
- **Google** — seulement si vous choisissez de vous connecter avec votre
  compte Google.
- **ComicVine** et **UPCitemdb** — interrogés pour les métadonnées, les
  images de couverture et les recherches par code-barres. Ces requêtes
  concernent des bandes dessinées, pas vous : aucun renseignement
  personnel ne leur est transmis.

Ces services peuvent héberger ou traiter des données **hors Québec**
[préciser les régions d'hébergement de Supabase et de Vercel].

Par ailleurs, même en l'absence d'analytique de notre part, ces
fournisseurs conservent des **journaux techniques** (connexions, adresses
IP, journaux d'authentification). Nous ne les consultons pas à des fins
d'analyse, mais ils existent, et une adresse IP est un renseignement
personnel. Nous préférons le dire plutôt que d'écrire « rien n'est
journalisé », ce qui serait inexact.

## 7. Conservation, suppression et accès à vos données

- **Suppression en libre-service.** L'application offre une fonction
  « supprimer mon compte » qui entraîne la suppression en cascade de
  votre compte et de toutes les données qui y font référence, y compris
  votre fichier avatar — confirmé comme étant réellement intégré à la
  fonction de suppression, pas seulement aux lignes de la base de
  données.
- **Copie de vos données.** Écrivez à l'adresse de la section 13 et le
  propriétaire vous enverra une copie de vos renseignements personnels et
  du contenu de votre compte dans un format lisible par machine (JSON ou
  CSV).
- **Correction.** Vous pouvez modifier votre nom d'utilisateur, votre nom
  d'affichage et votre avatar directement dans l'application. Pour tout
  le reste, écrivez-nous.
- **Conservation.** Les données sont conservées tant que votre compte
  existe. [Décider d'une politique pour les comptes inactifs, le cas
  échéant.]

## 8. Si le projet cesse ses activités

Il s'agit d'un projet géré par une seule personne, et il pourrait cesser
d'exister. Si le site est mis hors ligne :

1. Les utilisateurs seront avisés à l'adresse courriel de leur compte au
   moins **[X jours]** à l'avance.
2. Pendant cette période, vous pourrez exporter vos données ou en
   demander une copie.
3. À la fin de cette période, le projet Supabase sera supprimé. Cette
   suppression est permanente et irréversible : la base de données, les
   fichiers stockés, les comptes utilisateurs et toutes les copies de
   sauvegarde sont détruits sans aucune possibilité de récupération.

## 9. Exactitude des fonctionnalités dérivées

Plusieurs fonctionnalités (les « suites de lecture » suggérées, la
correspondance par image de couverture, la pertinence de recherche) sont
produites par des algorithmes et des heuristiques de correspondance
fondés sur une approche de meilleur effort. Il ne s'agit pas de faits
vérifiés ou garantis exacts : considérez chaque résultat comme notre
meilleure estimation compte tenu des données dont nous disposons. Ces
fonctionnalités peuvent être erronées, incomplètes ou, à l'occasion,
dénuées de sens, et nous ne garantissons pas leur exactitude.

## 10. Disponibilité des fonctionnalités dépendant de tiers

Comic Vault repose sur les paliers gratuits d'API publiques (ComicVine,
UPCitemdb). Ces paliers gratuits comportent des limites d'utilisation
hors de notre contrôle. Les fonctionnalités qui en dépendent peuvent
devenir lentes, limitées ou indisponibles en tout temps, sans que ce soit
la faute du site. Nous ne garantissons ni la disponibilité ni le bon
fonctionnement d'une fonctionnalité qui dépend d'un service tiers.

## 11. La sécurité de votre propre compte relève de votre responsabilité

Nous ne sommes pas responsables des conséquences de vos propres pratiques
de sécurité : un mot de passe faible, une session laissée ouverte sur un
appareil partagé, un oubli de déconnexion, ou le fait de donner l'accès à
votre session à quelqu'un d'autre. Utilisez un vrai mot de passe et
déconnectez-vous sur les appareils que vous ne contrôlez pas entièrement.

## 12. Utilisation acceptable

En utilisant Comic Vault, vous acceptez de ne pas :

- Tenter de briser, d'exploiter, de sonder les vulnérabilités ou
  d'attaquer autrement le site ou son infrastructure.
- Contourner, abuser ou solliciter excessivement les API tierces dont le
  site dépend, ou causer une violation des conditions d'utilisation de
  ces services par le site.
- Téléverser un avatar illégal, haineux, sexuellement explicite, ou sur
  lequel vous ne détenez pas les droits. Il n'y a aucune modération : le
  propriétaire peut retirer une image ou un compte dès qu'il en prend
  connaissance.
- Utiliser un accès partagé à une liste pour harceler la personne qui
  vous y a invité, ou pour redistribuer le contenu de sa liste ailleurs
  sans son consentement.

Une violation peut entraîner la suspension ou la suppression de votre
compte, [à la discrétion du propriétaire du site — formulation à valider
quant à son caractère exécutoire]. Pour signaler un problème, écrivez à
l'adresse de la section 13.

## 13. Aucune garantie / limitation de responsabilité

*(Espace réservé — clause à rédiger par un avocat. Notes : projet gratuit
géré par une seule personne, aucune garantie de disponibilité,
d'exactitude ou de sécurité, utilisation aux risques de l'utilisateur,
aucune responsabilité pour une perte de données, une atteinte à la
sécurité ou une interruption de service, dans la mesure permise par la
loi. Vérifier l'incidence de la Loi sur la protection du consommateur du
Québec sur ce type de clause pour un service gratuit.)*

## 14. Propriété intellectuelle

La favicône et l'interface du site ont été créées par le propriétaire du
site. Comic Vault n'est pas une marque déposée et le propriétaire n'en
tire aucun revenu. Un lien vers le site ou une mention si vous le
référencez ailleurs est apprécié, mais non requis.

**Les images de couverture et les métadonnées** affichées sur le site
proviennent de bases de données tierces (ComicVine, UPCitemdb) et
demeurent la propriété de leurs détenteurs de droits respectifs —
éditeurs, créateurs et fournisseurs de données. Comic Vault ne revendique
aucun droit sur celles-ci et les affiche à des fins de référence de
collection. [Vérifier les conditions de l'API de ComicVine quant aux
exigences d'attribution et les reproduire ici au besoin.]

## 15. Modifications de la présente politique

Ces conditions peuvent être modifiées en tout temps. Pour tout changement
important, les utilisateurs seront avisés [par courriel / par un avis
dans l'application] au moins [X jours] avant son entrée en vigueur.

## 16. Responsable de la protection des renseignements personnels, et contact

Le ou la responsable de la protection des renseignements personnels pour
Comic Vault est **[nom ou titre — le propriétaire du site]**, joignable
à :

**comicvault.support@gmail.com**

Écrivez à cette adresse pour toute question, pour exercer vos droits
d'accès, de rectification, de portabilité ou de suppression, ou pour
signaler le comportement d'un autre utilisateur.

## 17. Loi applicable

[Espace réservé — à déterminer avec l'avocat. Province de Québec, sous
réserve des règles impératives de protection du consommateur.]

---

## Questions ouvertes pour la révision juridique

1. **Applicabilité.** Comic Vault constitue-t-il une « entreprise » au
   sens du Code civil du Québec, et donc assujetti à la Loi 25? Aucune
   activité économique, aucun revenu, aucune promotion, une poignée
   d'utilisateurs adultes connus du propriétaire. Si non, quelles parties
   de ce document deviennent facultatives — et vaut-il la peine de les
   garder quand même?
2. **Section 13.** Une clause d'absence de garantie / de limitation de
   responsabilité est-elle exécutoire pour un service gratuit destiné aux
   consommateurs au Québec? Obtenir un libellé réel.
3. **Résiliation de compte.** La formulation « à la discrétion du
   propriétaire du site » doit-elle être adoucie ou encadrée pour être
   exécutoire?
4. **Hébergement hors Québec.** Si la Loi 25 s'applique, une évaluation
   des facteurs relatifs à la vie privée est-elle requise avant l'envoi
   de renseignements hors Québec, et quel degré de formalisme est requis
   pour un projet de cette taille?
5. **Responsable désigné.** Un nom légal complet doit-il apparaître, ou
   un titre et une adresse de contact suffisent-ils? (Préférence du
   propriétaire : ne pas publier son nom légal.)
6. **Délai de préavis** pour les modifications importantes et pour une
   fermeture : quel minimum?
7. **Versions linguistiques.** Si les deux versions sont publiées,
   laquelle prévaut en cas de divergence, et la Charte de la langue
   française impose-t-elle quelque chose ici? Voir
   `legal-draft-privacy-and-terms.md` pour le brouillon anglais parallèle.
8. **18 ans et plus.** Une simple condition d'utilisation suffit-elle,
   sans vérification d'âge, pour un service gratuit sans contenu pour
   adultes?
9. **Section 4, URL de l'avatar.** Décidé : les noms de fichiers sont
   maintenant aléatoires, dissociés de l'identifiant du compte (c'était
   auparavant l'identifiant interne du compte). Confirmer que tout avatar
   téléversé avant ce changement a été retéléversé depuis — sinon il se
   trouve toujours sous son ancien nom de fichier lié au compte — avant de
   publier cette section telle quelle.
