# Angela's Post Builder

Listing posts and reel titles in Angela Rera's style, one step at a time.

It lives at **`/builder/`** on the site — unlisted: nothing on the site links to
it, and its pages ask search engines to stay away. Angela has the link. The full
one-screen listing editor is at `/builder/advanced/`.

It moved here from `carlbahner-web/studioland-content-builder`, where it grew up
beside StudioLand's own layer editor; that repo's history is where the earlier
commits are.

```
cd builder
npm install
npm run dev            # http://localhost:5173 (her page) and /advanced/ (the full editor)
npm test               # the pure logic: the listing template, the guided flow, the reel title, the cutout
npm run test:browser   # every tool, driven in a real Chromium
npm run build          # typecheck + dist/
npm run build:single   # her page as ONE self-contained file (dist-single/angela.html), for a Claude artifact
npm run art            # re-key the listing artwork from assets/listing-src/
npm run matte          # re-key the backdrop out of the photographed headshots
npm run og             # redraw the link preview and the home-screen icon from her artwork
```

Chrome or Edge, on a laptop first; it works on a phone too, where saving falls
back to press-and-hold.

## Publishing

`.github/workflows/pages.yml` at the top of the repo publishes the whole site to
GitHub Pages on every push to `main`: the hand-written pages as they are, and
this builder tested, built and dropped in at `/builder/`. Pages has to be turned
on once, by hand: **Settings → Pages → Source: GitHub Actions**.

Her main site is published separately, by Netlify, straight from this repo with
no build step. That would serve the builder's unbuilt source at
`www.angelarerarealestate.com/builder/` as a blank page, so `netlify.toml` at
the top of the repo redirects `/builder/` there to the GitHub Pages copy.

The link preview's URLs in `index.html` are absolute, because previews are
fetched by other companies' servers. They name
`https://carlbahner-web.github.io/angelarerarealestate/builder/`; if the site
moves to its own domain, they move with it.

## Two pages, no router

`index.html` is her page: the home page ("What would you like to make?") with
the bookmark reminder, and the two guided tools. The cards switch tools by
state rather than by the address, so the same entry (`src/home/main.tsx`) also
works as a single file inside a Claude artifact, which routes on nothing.
A reload comes back to the home page; each tool keeps its draft, so nothing
typed is lost.

`advanced/index.html` is the full listing editor (`src/listing/ListingBuilder.tsx`),
every control on one screen. It draws with the same `drawDoc` from the same
`Doc` as the guided version, so the two cannot disagree, and most of the
drawing tests run against it because it can reach every option directly.

## Handing over the finished file

### Handing over the finished file

`save.ts`, because three environments need three different answers:

- **Desktop, served normally** — a plain `<a download>`, which is what people
  expect.
- **iOS, served normally** — `<a download>` on a blob is unreliable there, so
  the export also shows the image to press and hold, which is the gesture that
  actually works.
- **Inside a claude.ai artifact viewer** — the frame is not permitted to
  download at all and the anchor is silently inert. The viewer grants a
  `downloads` capability instead, which confirms with the person and saves.

The capability is feature-detected, never assumed: the hosted build has no
`window.claude` and must not care. Press-and-hold is only offered when the
browser path was the one that ran; a confirmed save needs no follow-up.

## The listing builder

**Angela uses the guided version**, "A listing post" on her home page: five steps with one question
each, built the same way as the reel title builder (`src/listing/ListingGuide.tsx`,
styles shared from `src/title/title.css` plus `src/listing/guide.css`):

1. **Which house is it?** Street, then town/state/ZIP. Her contact lines are
   added for her (`CONTACT_LINES` in `src/listing/guide.ts`) and never shown
   as editable. The address is always centred, as the design is.
2. **Add the photo of the house.** One button, or drag a photo onto the
   preview. It fills the space automatically. Which side her headshot goes on
   is chosen here, next to the framing, because her arch covers the bottom
   corner of the house photo on that side. "Move the photo" offers drag,
   Bigger/Smaller and "Put it back how it was" (no slider, no pinch).
3. **Sold or pending?** Three small copies of her post to tap: just the house,
   SOLD!, PENDING!, plus "Something else…" for her own words.
4. **Which headshot?** Every headshot, as small copies of the post, starting on
   "Hands in pockets" (`DEFAULT_HEADSHOT` in `src/listing/guide.ts`). Then
   "Looks good — save it".
5. **Saved!** The file name (`Sep26 listing 373 Meetinghouse.png`) and where it
   went, then how to post it from the computer (instagram.com) or the phone.
   Both lists are plain data (`POST_FROM_LAPTOP`, `POST_FROM_PHONE`).

The street, town, sign, headshot and side are kept between visits; the photo
can't be. **The full one-screen editor described below is at `advanced/`**,
drawing the same post with the same code, and `tests/browser/listing.test.ts`
runs against it. The guided flow has its own
`tests/browser/listing-guide.test.ts`. `npm run build:single` packs the guided
version, not this one.

### The full editor

One template, four controls. Its premise is that the graphic is **already
designed** — an
Angela Rera listing post, drawn in Photoshop and handed over as flats — and the
only things that change per listing are the address, which headshot, whether it
says SOLD, and the photo of the house. Every control beyond those four is a way
to get it wrong, so there is no layer list, no format picker and no undo stack.

### The one-file build

`npm run build:single` packs Angela's page into one HTML file with every asset
base64'd in, from the same entry as the site (`src/home/main.tsx`): it opens on
her home page with the bookmark reminder, and the cards switch tools by state,
because an artifact frame routes on nothing but a plain `#anchor`. That is what
gets published as her Claude artifact, so it starts with "What would you like
to make?". The full listing editor is not in it, and there is no reason to make
someone download it first. `assets.ts` is the seam that makes it possible:
asset paths go through `assetUrl()`, which returns the plain path normally and
a data URI when the one-file build has registered one on `window.__SL_INLINE`.

Two things that build has to get right, both invisible until they are wrong:

- The artifact host wraps the fragment in a skeleton that pads the root by the
  phone's safe-area insets. A child sized in `vh` ignores that padding and
  overflows by exactly the inset, putting a scrollbar on a page that fits — so
  the one-screen measurements are restated against the element.
- **A download the page starts itself is inert in that frame.** `<a download>`
  does nothing and throws nothing, so a tool that reports "saved" and did not is
  indistinguishable from a broken one. `canSaveFile()` in `save.ts` asks first —
  the viewer's `downloads` capability where there is one, otherwise whether this
  is a frame that will swallow the anchor — and the button says which it got.

### Green screens in, transparent layers out

The template arrived as five 1080×1350 flats with everything-that-isn't-this-
layer painted pure green. `npm run art` (`scripts/chroma-key.mjs`) keys the green
out, crops each layer to what survives, and writes the PNGs to `public/listing/`
with a placement manifest to `src/listing/layers.json`. Sources stay in
`assets/listing-src/`, so re-running it is the whole of "the art changed".

Two things about it are worth knowing, because both are the kind of mistake that
only shows up composited over a photo:

- **The edge pixels are blended with the green, not merely near it.** An
  antialiased edge holds `a·F + (1−a)·G`, so recovering the foreground is a
  division, not a subtraction of some spill fudge. Skip it and every cutout wears
  a green rim that is invisible against the green flat and obvious against a
  listing photo. The backing colour is *measured* per file rather than hardcoded,
  because the five exports turned out to hold two different greens.
- **Cropping is most of the size win.** Four of the five layers are mostly empty;
  the badges come out at 6kB against a 1.1MB frame.

The codec is `scripts/lib/png.mjs` — enough of the PNG spec to read the exports
and write the results, deliberately with no dependency, so this works from a
clean clone. It costs the single-file build about 1.9MB of base64, which is the
one real price: `content-builder.html` is now ~3.2MB rather than ~1.3MB.

### Layer order is the whole trick

```
   the listing photo        filling the band the frame leaves open
   the frame                keyed-out on top, opaque arch and navy below
   the headshot             OVER the frame, not under it
   the badge                SOLD! / PENDING!
   the type
```

The tempting mistake is putting the headshot *behind* the frame, which sounds
right and hides the arch completely: the "leaning" cut **is** the arch's fill and
replaces the floral paper exactly, and the "sitting" cut is a free cutout that
stands in front of it. A browser test samples inside the arch on both, because
the wrong order is a perfectly correct-looking data structure.

The photo band runs to y=705, not to y=605 where the frame art starts. The arch
pokes up into the green above the horizon, so filling only to 605 leaves a 100px
seam — invisible against a pale photo, glaring against a dark one.

### What the artwork actually said, and what it didn't

`src/listing/template.ts` holds every measured number, and three of them are not
what the handover said they were:

- **The address is centred, not right-aligned.** Its six lines end at x 1026,
  1002, 989 and 949 — a right margin that wanders by 77px, which reads as
  ragged-right. But all six share a centre at x 819.5, which is the designer's
  own guide rectangle's centre to within a pixel. Setting it to `right` lines the
  block up on an edge the design does not have.
- **The lower column is distributed, not inherited.** Between the photo's bottom
edge (y=705) and the strapline (y=1278) there is a fixed 573px holding two
blocks of type. The artwork spent that 41 / 28 / 64, but both blocks render
shorter here than the flats were — the badge by 31px because it was set in a
condensed face this repo does not have, the address by 30px because the column
was narrowed to the gutter — so 61px of type became slack, all of it pooled at
the bottom, and the column read as drifting up away from the strapline. The
gaps are equal now: 573 − 70 − 308 = 195, over three gaps, is **65px each**.

The `y` values in `template.ts` are those targets converted through what the
font actually renders — the badge's cream cap lands 2px under its box, the
address's 1px over — so they are not simply 705+65 and its successor. A browser
test measures the three gaps on the real canvas and fails if they drift apart,
because that conversion is a property of the face rather than of any arithmetic
in the template.

**One gutter governs the type column.** `GUTTER` is 37 — the strapline's own
margin, measured off the artwork — and `ADDRESS_BOX` is derived from it on both
sides: `ARCH_RIGHT + 1 + GUTTER` on the left, `CANVAS.w - GUTTER` on the right.
The badge inherits the column.

As drawn, the guide rectangle ran x 578→1060: 23px from the arch, 20px from the
edge, against the strapline's 37px. So the address sat closer to both the
photograph and the artboard edge than the line directly beneath it — a near-miss
that reads as sloppy without being obviously wrong.

`ARCH_RIGHT` is measured, not assumed. The arch is a curve: at the address's
first row it has not finished coming in (x=548), and for the rest of the block
it is straight-sided at x=555. The widest point is what the gutter has to clear,
and a unit test guards that it still describes the keyed artwork.

Narrowed rather than moved. Shifting the box would have kept the type size and
simply traded one crowded side for the other; a gutter is only worth having on
both. It costs 3px of type — `ADDRESS_SIZE` is 40, not 43 — which is 7% of a
40px face and invisible.

Worth knowing what that does and does not buy: **a centred block has no fixed
margin.** Each line ends where its words end, so the *box* is at 37px on both
sides while the seeded longest line's ink lands at 45px and 42px, and a
different address moves both again. Right-aligning would make every line end on
37px exactly; the artwork is centred, so it stays centred, and what the change
bought is a column that is evenly placed rather than one crowded on both sides.

**The Character panel's 50.51pt does not fit.** At that size the longest line
  measures 561px in a 482px box. Measuring each line's ink against what
  `public/fonts/TAYWingman.woff2` actually renders puts the artwork at ~46.2px
  for the first four lines and ~42.9px for the last two — two sizes, and neither
  of them 50.5. The likeliest explanation is that it was set in a different cut
  of the face than the one that ships here. Rather than guess at that, the
  constants are derived from the font in the repo: one size for the whole block,
  chosen to clear the box with a little to spare. The tracking (−100, i.e.
  −0.1em) is the one panel value that survives contact with the artwork, and it
  already agreed with `layers.ts`.
- **The outline is the artwork's, not a feature.** Every piece of type in the
  handover carries one — SOLD! and PENDING! plainly, the address more softly —
  and without it pale pink type on a mid-value photo has no edge at all. So it
  is drawn and not offered: there is no control for it, because a listing where
  someone switched it off is a listing that is off-brand.
- **The address's outline colour could not be sampled.** It is semi-transparent
  and the export baked it against the green, so the flat `#505923` sitting in
  that file is a blend, not a colour anyone chose. The badges are opaque, so they
  are the honest source for what "outlined" means here — pink `#ffe6ea` on navy
  `#0b1c40` — and both are editable in the UI anyway.

`tests/browser/listing.test.ts` re-measures the size, the cap ratio and the line
pitch against the real font in a real browser, so swapping the font file fails a
test rather than quietly reflowing every graphic anyone makes.

### The badge is type, not a picture

SOLD! and PENDING! arrived as two more green flats and shipped that way at
first. They are live type now, in the same block machinery as the address, so
the badge can say something the designer did not draw — OPEN SUNDAY!, UNDER
CONTRACT! — and shrinks to its column if it is long.

**Its placement is not obvious from the artwork.** SOLD! spans x 677–962 and
PENDING! spans 593–1047: different widths, and neither the left nor the right
edge shared. What they share is a centre at x 819.5, which is the address
block's centre to within half a pixel. So the badge is the same column, centred,
sitting directly above the address — not a right-aligned thing that happens to
vary, which is what a glance at the two files suggests.

**It is the same face as everything else, set tight.** This was got wrong once
and is worth writing down. Measured against TAY Wingman's advance widths at the
address's −0.1em tracking, SOLD! came out 27% too narrow for its height, and the
conclusion drawn was that the badges had been set in a heavier condensed cut this
repo does not have. They had not. Two errors compounded: the artwork was measured
as an **ink box** and compared against the font's **advance width**, which is
wider by the side bearings; and the badge was assumed to share the address's
tracking, because the one Character panel that shipped happened to be the
address's.

The badge is TAY Wingman at **130px with −0.2em tracking** — twice as tight as
the address — with a 7px stroke. At those values the font reproduces the flats
almost exactly: SOLD! renders a 274×89 ink box against the artwork's 272×87, and
PENDING! 440×90 against 440×87. Tracking and outline weight are therefore
per-block rather than template-wide, and a browser test pins the rendered ink box
to the artwork's own measurements.

The way to measure a stroked flat is to separate the **cream fill** from the
navy around it: the fill is the unstroked glyph, and the difference is the
stroke. The originals are kept in `assets/listing-src/reference/` for exactly
that; `chroma-key.mjs` skips the folder because it only reads the PNGs beside
it.

One behaviour worth knowing: the outline is a fixed fraction of the type size,
so a badge shrunk far enough for a whole sentence closes over its own fill.
That is correct for words that do not belong on a badge, and it is why the
browser test pushes it to "UNDER CONTRACT!" rather than to a paragraph.

### One piece of type, and it does not move

The whole editable surface is four things: the photo, which headshot, what the
badge says, and the address. There is no way to add a text block, no way to
resize one and no way to drag anything but the photo.

That is the tool converging on what it is. Earlier versions offered a text
size, a second and third slot to put type in, colour pickers and an outline
switch, and every one of them was a way to make a graphic that no longer
matches the last one. A template whose contact details have drifted four pixels
left between one listing and the next is worse than one that could not be
adjusted at all.

Type still sits in **named slots** rather than at hardcoded coordinates, and
this template has exactly two — the address and the badge. The indirection earns its keep anyway: the
mirrored version of this design is the same tool with the boxes on the other
side, which is a different list in `template.ts` rather than a different
editor.

The address's size is the design's, and gives only when what is typed will not
fit — see *Long addresses shrink*.

### The photo is the bottom layer

The listing photo sits under everything — the frame's keyed-out top is the hole
it shows through — and it can be dropped onto the stage, dragged to place and
scaled from 100% down to the whole photo and up to 4×.

**Scale is a multiple of cover, not of the photo's own pixels.** That is what
makes 100% mean the same thing for every photo: exactly filling the band,
whatever shape it came in. A multiplier of the file's natural size would put the
useful range somewhere different for a phone snap than for a 6000px camera file,
and the slider would be useless on one of them.

**Drag or pinch, and the pinch is anchored.** Zooming about a point rather than
about the band's centre is what makes a pinch feel like a pinch: whatever is
under the two fingers stays under them. Zooming about the centre slides the
picture away while you are framing a detail with it, and at 3× that reads as
broken rather than imprecise. A trackpad pinch arrives as a `wheel` event with
`ctrlKey` set — there is no gesture event for it outside Safari — and it has to
be `preventDefault`'d or the browser zooms the whole page; React attaches wheel
passively at the root, where that is ignored, so that one listener is bound by
hand.

The pinch is computed frame to frame rather than against where the fingers
started. The two are identical until a finger is added or lifted, and then the
"since the start" version jumps, because its baseline belongs to a gesture that
no longer exists.

**The floor is "the whole photo", not 100%.** Listing photos are usually 3:2 or
4:3 and the band is 1.53:1, so covering it crops the top and bottom — often the
roofline and the yard, which are the point. Below 100% the photo letterboxes,
and the letterbox is filled with the artwork's own navy, so it reads as an inset
rather than a hole. That backdrop is painted unconditionally, before the photo
rather than instead of it: skip that and zooming out punches a transparent hole
through the top of the graphic, which the PNG then carries.

Panning is bounded by whichever axis has play in it — to the edge of the
overhang where the photo is bigger than the band, and to the edge of the band
where it is smaller, so an inset photo can be placed rather than stuck in the
middle and an oversized one can never be pulled off to leave a gap.

### Saving it on a phone

This is used from a phone more than from a desk, and a programmatic download is
not reliable there. iOS Safari treats `<a download>` on a blob inconsistently —
it often opens the image in a new tab instead of saving it — so a tool that
reports "Saved" on that path has told the person something untrue.

So the export falls back to the `.held` sheet: on a coarse pointer, where the *browser* download was the one
that ran, the finished PNG goes on screen full size to press and hold, which is
the gesture that actually saves to Photos. A capability save is confirmed and
needs no follow-up; on a desktop the anchor simply works. It is handed over as
a data URI rather than a blob URL, because long-press "Add to Photos" is
reliable on one and not on the other.

`tests/browser/listing.test.ts` drives this on an emulated phone rather than
just a narrow window — `hasTouch` and `isMobile` are what make
`(pointer: coarse)` match, and a narrow viewport alone tests the wrong branch.

### Long addresses shrink, they do not wrap

The box is sized for "373 Meetinghouse Ln" and somebody will type "1247 Old
Gettysburg Pike, Suite 210". Overflowing runs the type off the artwork; wrapping
silently re-breaks an address that was deliberately arranged into lines. So the
*size* gives and the arrangement survives — bisected rather than stepped down,
because `measureText` is a real call and a keystroke should not cost hundreds of
them.

## Angela's home page

**Her address is `/builder/`** (`https://carlbahner-web.github.io/angelarerarealestate/builder/`).
It is titled **Angela's Post Builder** and carries its own link preview:
`public/preview.jpg` (1200×630) and a home-screen icon, `public/icon.png`. Both
are drawn from her artwork by the tools' own
drawing code - the peony paper and the listing arch with her default headshot -
so `npm run og` remakes them after any artwork or headshot change. The page is
still `noindex`: the title and preview are for people she shares it with.

It runs the same entry as her Claude artifact (`src/home/main.tsx`), switching
between the home page and the two tools in place.

The home page is the one address Angela keeps: "What would you like to make?" and
two big cards, **A listing post** and **A reel title**. Each tool's header has
a "← Home" button back to it.

Every visit opens with a **Bookmark this page** reminder that tells her which
keys to press on the machine she's on (Ctrl+D on Windows). "Skip for now" is
not remembered, so the reminder comes back next visit; only "I bookmarked it"
puts it away, kept in `localStorage`. If storage is blocked, it shows every
time, which is the safe side to fail on. `tests/browser/home.test.ts` checks
both.

## The reel title builder

"A reel title" on her home page. Angela types a title;
it comes back as a **1080×1920 transparent PNG** with the navy peony banner
across the top of the frame and the title set on it, and nothing anywhere else.

It is full frame on purpose. A banner-sized PNG has to be positioned and scaled
by hand in whatever app the reel is edited in; one the size of the reel is laid
over the whole video and is already in the right place.

Nothing is a control except the words.

### The safe box

Every letter of a title lands inside one rectangle, `SAFE_BOX` in
`src/title/template.ts`, and each of its edges is a decision:

| Edge | Value | Why |
| --- | --- | --- |
| Top | 220px | Measured off her own reel: Instagram's back arrow and camera button end about 200px down. Chosen over Meta's blanket 14% (270px), which also allows for ads, to keep the banner smaller. |
| Sides | 65px each | Meta's 6% side margin. |
| Bottom | 440px | How far down a title may reach. 220px of height is enough for four lines. |

The banner is not held inside the box. It runs from the top edge of the frame,
so Instagram's buttons sit on navy, down to 50px below the box (490px, about a
quarter of the video). It is **the same height on every reel**, so a feed of them reads as
a series, and it is level, like her listing posts.

### Placing and spacing the text

- **Line breaks** are chosen by trying every break into one to four lines and
  keeping the one that lets the type be biggest, which is the same as the most
  balanced. A break after punctuation is preferred, a colon or question mark in
  the middle of a line is avoided, and so is a line ending on "to", "the", "or"
  and the like. Pressing Enter in the text overrides all of that.
- **Size** is the largest that fits the safe box both ways, capped at 118px so a
  one-word title is not a billboard.
- **Position**: the block is centred in the safe box both ways. Vertically it is
  the ink that is centred, from the top of the first line's capitals to the
  last baseline, so a short title does not sit visibly high.
- **Spacing**: lines sit 1.16em apart, baseline to baseline, and letters use
  the listing address's -0.1em tracking, so titles read as the same brand as
  her listing posts.

### The page: four guided steps

The page is built for someone who wants the title and nothing else, on the
Windows laptop where the reel is edited in Descript. A title made there
saves straight to Downloads and drags into Descript, with no phone or cable
involved. One thing to do per screen, big type and buttons, plain words
(picture, save, Downloads folder; never PNG, transparent or export):

1. **What should your title say?** One big text box, starting empty, with an
   example in grey. "Next" stays off until something is typed. The draft is
   kept in the browser, so closing the tab loses nothing.
2. **Here's your title.** The banner, large, beside a small "on your video"
   preview. If the words split more than one way, up to three versions are
   shown to tap (`titleChoices`: the best split for each number of lines).
   A kind note appears if the title is long enough to make the letters small.
3. **Saved!** The file name and where it went. Names start with the month and
   day so a Downloads folder sorts by date, then "reel title", then the first
   three words that aren't filler (a, the, to...): `Sep26 reel title Pet owners
   fence.png`.
   On a phone this step shows the picture to press and hold instead.
4. **Put it on your video in Descript.** Five numbered steps. They are plain
   data (`DESCRIPT_STEPS` in `TitleBuilder.tsx`) so the wording can follow
   Descript's screens without touching the page.

Add `?guides` to the address (before the `#`) to see the safe box on the
preview. It's there for checking the layout, and nothing on the page links to
it. `tests/browser/title.test.ts` walks the whole flow and checks the saved file.

The peony paper is not a new asset. It is the clean navy field cut out of
`public/listing/frame.png`, tiled against its own mirror image - which is what
the mirrored listing layout already is, so the repeat has no seam.

The text is TAY Wingman in the strapline's cream (`INK`). The
layout is pure and tested in `src/title/template.test.ts`; drawing is
`src/title/draw.ts`, shared by the preview and the export.


## The artwork

The listing template's artwork has one source of truth: the green-screen
masters in `assets/listing-src/`. `public/listing/` holds what `npm run art`
makes of them, so edit the masters, never the output. The photographed
headshots' backdrops are keyed out by `npm run matte`, per shot, from the
settings in `src/listing/photos.json`.

## Not built yet

- **A second listing template.** The geometry lives in one file per template
  (`src/listing/template.ts`) and the art in one folder, so a second one is
  those two plus an entry in the manifest — but nothing is parameterised for it
  yet, and it should not be until there are two.
