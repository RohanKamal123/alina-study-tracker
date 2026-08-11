#!/usr/bin/env python3
"""Builds the printable how-to guide as a single self-contained HTML file.

Fonts are embedded as base64 so the rendering browser never needs network
access, and so the PDF carries the same typography as the app itself.
"""
import base64
import pathlib

# Fonts are read straight out of the Next.js build so the guide's typography
# matches the app exactly and the renderer needs no network access.
#   1. npm run build
#   2. python3 docs/build-guide.py
#   3. print docs/guide.html to PDF (A4, background graphics on, no margins)
HERE = pathlib.Path(__file__).resolve().parent
MEDIA = HERE.parent / ".next" / "static" / "media"


def _font_b64(stem_size_rank: int) -> str:
    """Largest woff2 files are the full latin subsets we want."""
    files = sorted(MEDIA.glob("*.woff2"), key=lambda p: p.stat().st_size, reverse=True)
    return base64.b64encode(files[stem_size_rank].read_bytes()).decode()


FONTS = {"fraunces": _font_b64(0), "jakarta": _font_b64(2)}
OUT = HERE / "guide.html"

CAT_FACE = """<svg viewBox="0 0 48 48" fill="none" style="width:100%;height:auto;display:block">
  <path d="M9 18V7.5l10 6.2z" fill="currentColor"/><path d="M39 18V7.5l-10 6.2z" fill="currentColor"/>
  <path d="M24 12c9 0 15 5.9 15 14.3C39 34.9 32.6 41 24 41S9 34.9 9 26.3C9 17.9 15 12 24 12" fill="currentColor"/>
  <ellipse cx="17.6" cy="25.4" rx="2.5" ry="3.1" fill="#fffdfa"/><ellipse cx="30.4" cy="25.4" rx="2.5" ry="3.1" fill="#fffdfa"/>
  <ellipse cx="17.6" cy="25.8" rx="1.15" ry="1.9" fill="#3a2a1d"/><ellipse cx="30.4" cy="25.8" rx="1.15" ry="1.9" fill="#3a2a1d"/>
  <path d="M24 30.2l-2-1.6h4z" fill="#fffdfa"/>
  <path d="M13.5 28.5H7M13.8 31.4l-6 1.8M34.5 28.5H41M34.2 31.4l6 1.8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
</svg>"""

SLEEPING_CAT = """<svg viewBox="0 0 200 150" fill="none" style="width:100%;height:auto;display:block">
  <!-- tail, curling out from behind the body -->
  <path d="M152 120c24 5 36-6 34-21-2-14-17-17-24-9-5 7 1 14 8 12"
        stroke="currentColor" stroke-width="11" stroke-linecap="round" fill="none" opacity=".6"/>
  <!-- body -->
  <path d="M44 122c-16 0-28-12-28-29 0-28 26-49 60-49s62 19 62 47c0 18-12 31-29 31z" fill="currentColor"/>
  <!-- ears: drawn first so the head overlaps their base -->
  <path d="M40 66 L34 30 L64 52 Z" fill="currentColor"/>
  <path d="M84 66 L90 30 L60 52 Z" fill="currentColor"/>
  <!-- head -->
  <circle cx="62" cy="90" r="32" fill="currentColor"/>
  <!-- closed, sleeping eyes -->
  <path d="M46 88c3 3.6 8 3.6 11 0M67 88c3 3.6 8 3.6 11 0"
        stroke="#fffdfa" stroke-width="3" stroke-linecap="round" fill="none"/>
  <!-- nose -->
  <path d="M62 97l-3-2.6h6z" fill="#fffdfa"/>
</svg>"""

PAW = """<svg viewBox="0 0 32 32" fill="none" style="width:100%;height:auto;display:block">
  <ellipse cx="16" cy="21.5" rx="7" ry="5.8" fill="currentColor"/>
  <ellipse cx="7.6" cy="14.2" rx="3.2" ry="4.1" fill="currentColor" transform="rotate(-18 7.6 14.2)"/>
  <ellipse cx="13.2" cy="9.4" rx="3.1" ry="4.2" fill="currentColor" transform="rotate(-6 13.2 9.4)"/>
  <ellipse cx="19.4" cy="9.4" rx="3.1" ry="4.2" fill="currentColor" transform="rotate(6 19.4 9.4)"/>
  <ellipse cx="24.6" cy="14.2" rx="3.2" ry="4.1" fill="currentColor" transform="rotate(18 24.6 14.2)"/>
</svg>"""

LEVELS = [
    (0, "Never started this chapter", "#b9a68f"),
    (1, "Just know what is in the chapter", "#b45309"),
    (2, "Know some parts of it", "#d97706"),
    (3, "Knew it, but needs a revision", "#ca8a04"),
    (4, "Can solve 70–80% of CQ, MCQ and SQ", "#65a30d"),
    (5, "Can solve everything", "#15803d"),
]


def level_row(n, label, color, big=False):
    size = "34px" if big else "26px"
    fs = "15px" if big else "12px"
    return f"""<div class="lvrow">
      <span class="lvchip" style="background:{color};width:{size};height:{size};font-size:{fs}">{n}</span>
      <span class="lvlabel">{label}</span>
    </div>"""


def page(inner, num, total, label="", cover=False):
    foot = "" if cover else f"""<footer class="pfoot">
    <span class="pfoot-l">{label}</span>
    <span class="pfoot-r">{num} / {total}</span>
  </footer>"""
    return f"""<section class="page{' page-cover' if cover else ''}">
  {inner}
  {foot}
</section>"""


TOTAL = 8

# ---------------------------------------------------------------- cover ----
cover = f"""
<div class="cover">
  <div class="cover-cat">{CAT_FACE}</div>
  <p class="cover-kicker">How to use</p>
  <h1 class="cover-title">Alina&rsquo;s Study&nbsp;Desk</h1>
  <p class="cover-sub">A simple guide to tracking tuition, syllabus and study<br>on the way to SSC 2027</p>
  <div class="cover-url">alina-study-tracker.vercel.app</div>
  <div class="cover-sleep">{SLEEPING_CAT}</div>
</div>
"""

# ------------------------------------------------------------- page 2 ------
p2 = f"""
<h2 class="h2">Start here <span class="h2-num">1</span></h2>
<p class="lead">Three things to do once. After that the app takes about two minutes a day.</p>

<div class="steps">
  <div class="step">
    <span class="step-n">1</span>
    <div>
      <h3>Open it on your phone</h3>
      <p>Go to <b>alina-study-tracker.vercel.app</b> in Chrome. Tap the browser menu and choose
      <b>&ldquo;Add to Home screen&rdquo;</b>. Now it opens like a normal app, with its own icon.</p>
    </div>
  </div>
  <div class="step">
    <span class="step-n">2</span>
    <div>
      <h3>Add your teachers</h3>
      <p>Open <b>Teachers</b> &rarr; <b>Add</b>. Put in each tutor and coaching centre, choose
      <b>Tutor</b> or <b>Coaching</b>, <b>Online</b> or <b>Offline</b>, and tap the subjects they teach.
      Add the monthly fee if you want to track payments.</p>
    </div>
  </div>
  <div class="step">
    <span class="step-n">3</span>
    <div>
      <h3>Add your class times</h3>
      <p>Open <b>Schedule</b> &rarr; <b>Add slot</b>. Pick the day and time for each regular class.
      Do this once and your week is set.</p>
    </div>
  </div>
</div>

<div class="callout callout-warm">
  <div class="callout-ico">{PAW}</div>
  <div>
    <b>When a teacher changes &mdash; and they will.</b>
    Do <u>not</u> delete them. Open the teacher and tap <b>&ldquo;Stopped studying&rdquo;</b>.
    Their old classes, notes and fees stay in your history, and their class times switch off
    automatically. If they come back later, tap <b>Resume</b>.
  </div>
</div>
"""

# ------------------------------------------------------------- page 3 ------
p3 = f"""
<h2 class="h2">Every day <span class="h2-num">2</span></h2>
<p class="lead">Open the <b>Today</b> page. Everything you need for the day is on this one screen.</p>

<div class="grid2">
  <div class="mock">
    <div class="mock-hero">
      <div class="mock-eyebrow">SSC EXAMINATION</div>
      <div class="mock-days"><span class="mock-num">149</span> days left</div>
      <div class="mock-sub">About 21 weeks to go</div>
      <div class="mock-hero-cat">{SLEEPING_CAT}</div>
    </div>
    <div class="mock-stats">
      <div><span class="ms-l">STUDIED</span><span class="ms-v">1h 15m</span></div>
      <div><span class="ms-l">STREAK</span><span class="ms-v">4 days</span></div>
      <div><span class="ms-l">CLASSES</span><span class="ms-v">2</span></div>
      <div><span class="ms-l">ROUTINE</span><span class="ms-v">3/4</span></div>
    </div>
  </div>

  <div class="daylist">
    <h3 class="mini">Do these four things</h3>
    <ol class="checks">
      <li><b>Tick your routine.</b> Small daily habits &mdash; morning revision, homework, sleep by 11.</li>
      <li><b>Log each class.</b> Tap <b>Log</b> next to a class and write what was actually covered,
          plus any homework given.</li>
      <li><b>Run the study timer</b> when you sit down to study. <u>Pick the subject first</u> &mdash;
          this is what makes the Insights page work.</li>
      <li><b>Check the topic strip</b> &mdash; three days back, today, three days ahead.</li>
    </ol>
  </div>
</div>

<div class="callout">
  <div class="callout-ico">{PAW}</div>
  <div><b>Homework writes itself.</b> Anything you type into the &ldquo;Homework given&rdquo; box when
  logging a class appears automatically on the <b>Homework</b> page. You never enter it twice.</div>
</div>

<h3 class="mini mt">What to write when you log a class</h3>
<div class="grid3">
  <div class="fcard">
    <span class="fc-k">STATUS</span>
    <p class="fp">Did it actually happen? <b>Held</b>, <b>Cancelled</b>, <b>I missed it</b> or
    <b>Rescheduled</b>. Be truthful &mdash; this is what tells you later whether a teacher is
    reliable.</p>
  </div>
  <div class="fcard">
    <span class="fc-k">WHAT WAS COVERED</span>
    <p class="fp">One line is enough. <i>&ldquo;Finished Newton&rsquo;s 2nd law, did 6 problems from
    ch.3.&rdquo;</i> Next week this is how you remember where you actually got to.</p>
  </div>
  <div class="fcard">
    <span class="fc-k">HOW WELL DID YOU FOLLOW?</span>
    <p class="fp">A 1&ndash;5 tap. If a teacher keeps scoring 2s, that is worth noticing early
    rather than in December.</p>
  </div>
</div>
"""

# ------------------------------------------------------------- page 4 ------
p4 = f"""
<h2 class="h2">The 0&ndash;5 scale <span class="h2-num">3</span></h2>
<p class="lead">This is the heart of the app. Open <b>Syllabus</b>, tap a subject, and give every
chapter an honest number.</p>

<div class="lvbox">
  {''.join(level_row(n, l, c, big=True) for n, l, c in LEVELS)}
</div>

<div class="callout callout-warm">
  <div class="callout-ico">{PAW}</div>
  <div><b>Be honest, not generous.</b> The whole point is to find the weak chapters while there is
  still time to fix them. A syllabus full of 5s that isn&rsquo;t true helps nobody in January.</div>
</div>

<h3 class="mini mt">What you get back</h3>
<div class="grid2 tight">
  <div class="infobox">
    <b>A bar for every chapter</b>
    <div class="barsdemo">
      <span style="height:100%"></span><span style="height:80%"></span><span style="height:60%"></span>
      <span style="height:20%"></span><span style="height:10%"></span><span style="height:100%"></span>
      <span style="height:40%"></span><span style="height:10%"></span><span style="height:10%"></span>
      <span style="height:60%"></span><span style="height:80%"></span><span style="height:10%"></span>
    </div>
    <p>Tall bars are strong chapters. The short ones show exactly where the gaps sit along the book.</p>
  </div>
  <div class="infobox">
    <b>A percentage per subject</b>
    <div class="pctdemo"><span>Physics</span><b>41%</b></div>
    <div class="pctbar"><i style="width:41%"></i></div>
    <p>100% means every chapter is at level 5. Each subject is scored on its own &mdash; there is no
    single overall number, because the useful question is always <i>which subject is weak?</i></p>
  </div>
</div>

<div class="callout mt">
  <div class="callout-ico">{PAW}</div>
  <div><b>Not sure which number to pick?</b> Ask yourself one question:
  <i>&ldquo;Could I solve a CQ from this chapter right now, with the book closed?&rdquo;</i>
  A confident yes is <b>5</b>. Yes but slowly is <b>4</b>. &ldquo;I knew this last month&rdquo; is
  <b>3</b>. Anything vaguer is <b>2</b> or below.</div>
</div>

<div class="callout callout-warm">
  <div class="callout-ico">{PAW}</div>
  <div><b>Re-rate honestly, not just upward.</b> If a chapter has slipped, move it back down. The
  app tracks every change, so a chapter that drops from 4 to 3 shows up in your revision list
  instead of quietly rotting at the wrong number.</div>
</div>
"""

# ------------------------------------------------------------- page 5 ------
p5 = f"""
<h2 class="h2">Every week <span class="h2-num">4</span></h2>

<div class="wk">
  <div class="wk-i">{PAW}</div>
  <div>
    <h3>Update your chapter levels</h3>
    <p>Sunday evening is a good time. Move anything you studied this week up a level. This takes
    two minutes and is what powers the whole Insights page.</p>
  </div>
</div>

<div class="wk">
  <div class="wk-i">{PAW}</div>
  <div>
    <h3>Fill in the Class plan</h3>
    <p>At the start of each month, ask every teacher: <i>&ldquo;What will we cover this month?&rdquo;</i>
    Write it on the <b>Class plan</b> page. Tick topics off as they actually happen.</p>
    <p class="small">Anything not finished can be pushed into next month with one tap, so nothing
    quietly disappears.</p>
  </div>
</div>

<div class="wk">
  <div class="wk-i">{PAW}</div>
  <div>
    <h3>Read the Insights page</h3>
    <p>Once there is a week of history it starts answering real questions:</p>
    <ul class="ticks">
      <li><b>Will you finish in time?</b> Your actual pace against the days left.</li>
      <li><b>Weakest chapters</b> &mdash; everything sitting at 0, 1 or 2.</li>
      <li><b>Due a revision</b> &mdash; strong chapters you haven&rsquo;t touched in a month.</li>
      <li><b>Where your time goes vs. where it is needed</b> &mdash; catches you spending hours on a
      subject that is already strong while a weak one sits untouched.</li>
      <li><b>Are your teachers delivering?</b> &mdash; how often classes actually ran, and whether
      they covered what they promised.</li>
    </ul>
  </div>
</div>
"""

# ------------------------------------------------------------- page 6 ------
p6 = f"""
<h2 class="h2">Every page, briefly <span class="h2-num">5</span></h2>

<table class="tbl">
  <tr><th>Page</th><th>What it is for</th></tr>
  <tr><td><b>Today</b></td><td>Your day at a glance: countdown, classes, routine, homework, and the topic strip.</td></tr>
  <tr><td><b>Calendar</b></td><td>Plan what to study on a day, then come back and record what was actually covered.</td></tr>
  <tr><td><b>Teachers</b></td><td>Every tutor and coaching centre, their subjects, fees and contact.</td></tr>
  <tr><td><b>Schedule</b></td><td>Your regular weekly class times, Saturday to Friday.</td></tr>
  <tr><td><b>Class plan</b></td><td>What each teacher will cover this month, and the next two weeks of classes.</td></tr>
  <tr><td><b>Syllabus</b></td><td>Every chapter, rated 0&ndash;5, with a progress graph per subject.</td></tr>
  <tr><td><b>Insights</b></td><td>What your data says: pace, weak spots, revision due, where your time goes.</td></tr>
  <tr><td><b>Homework</b></td><td>Tasks grouped by overdue, today, tomorrow and later.</td></tr>
  <tr><td><b>Exams</b></td><td>Upcoming exams and their paper-by-paper routine, with a countdown.</td></tr>
  <tr><td><b>Study timer</b></td><td>A stopwatch for self-study. Always pick the subject first.</td></tr>
  <tr><td><b>Routine &amp; goals</b></td><td>Daily habits and bigger targets you are working towards.</td></tr>
  <tr><td><b>Fees</b></td><td>What is owed each month, next to how many classes actually happened.</td></tr>
  <tr><td><b>Settings</b></td><td>Subjects, exam date, study goal, theme, cloud sync and backup.</td></tr>
</table>

<div class="callout">
  <div class="callout-ico">{PAW}</div>
  <div>On a phone the bar at the bottom holds <b>Today, Calendar, Syllabus, Insights</b> and
  <b>Study timer</b>. Everything else is under <b>More</b>.</div>
</div>
"""

# ------------------------------------------------------------- page 7 ------
p7 = f"""
<h2 class="h2">Keeping your data safe <span class="h2-num">6</span></h2>

<div class="grid2">
  <div class="infobox tall">
    <b class="ib-h">Using two devices</b>
    <p>In <b>Settings &rarr; Cloud sync</b>, turn sync on. You get a long <b>sync code</b>.</p>
    <p>On your other device, open the same site, go to Settings, and paste that code under
    <i>&ldquo;use an existing code&rdquo;</i>. Both devices now share one set of data.</p>
    <div class="warn">
      <b>The sync code is your password.</b> Anyone who has it can read and change everything.
      Never put it in a screenshot or send it to anyone.
    </div>
  </div>

  <div class="infobox tall">
    <b class="ib-h">Backups</b>
    <p>Sync is convenience, <u>not</u> a backup &mdash; a mistake copies itself to every device
    within seconds.</p>
    <p>Once every few weeks: <b>Settings &rarr; Export backup</b>. It saves a small file. That file
    is the only thing that survives clearing your browser or a bad edit.</p>
    <p>To restore, use <b>Import backup</b> and pick the file.</p>
  </div>
</div>

<h3 class="mini mt">If something looks wrong</h3>
<table class="tbl small-tbl">
  <tr><th>What you see</th><th>What to do</th></tr>
  <tr><td>A subject has no teacher</td><td>Today page warns you. Either find a tutor or plan self-study for it.</td></tr>
  <tr><td>&ldquo;Still measuring&rdquo; on Insights</td><td>Normal. It needs about a week of chapter ratings before it will quote a pace.</td></tr>
  <tr><td>Study time shows no subject</td><td>You used the timer without picking a subject. Pick one next time.</td></tr>
  <tr><td>&ldquo;Sync failed&rdquo;</td><td>Check your internet. Your data is still safe in the browser either way.</td></tr>
</table>
"""

# ------------------------------------------------------------- page 8 ------
p8 = f"""
<h2 class="h2">The short version <span class="h2-num">7</span></h2>
<p class="lead">If you remember nothing else, remember this page.</p>

<div class="finalgrid">
  <div class="fcard">
    <span class="fc-k">EVERY DAY</span>
    <ul>
      <li>Tick your routine</li>
      <li>Log each class &mdash; what was covered, what homework</li>
      <li>Run the timer, <b>with the subject selected</b></li>
    </ul>
  </div>
  <div class="fcard">
    <span class="fc-k">EVERY WEEK</span>
    <ul>
      <li>Update chapter levels on <b>Syllabus</b></li>
      <li>Read <b>Insights</b></li>
      <li>Clear anything in <b>Due a revision</b></li>
    </ul>
  </div>
  <div class="fcard">
    <span class="fc-k">EVERY MONTH</span>
    <ul>
      <li>Ask teachers what they will cover, write it in <b>Class plan</b></li>
      <li>Mark fees paid</li>
      <li><b>Export a backup</b></li>
    </ul>
  </div>
</div>

<div class="lvbox compact">
  <div class="lv-h">The 0&ndash;5 scale, again</div>
  {''.join(level_row(n, l, c) for n, l, c in LEVELS)}
</div>

<div class="closing">
  <div class="closing-cat">{SLEEPING_CAT}</div>
  <p>Two minutes a day beats a panic in December.<br><b>Good luck, Alina.</b></p>
</div>
"""

pages = [
    page(cover, 1, TOTAL, "", cover=True),
    page(p2, 2, TOTAL, "Start here"),
    page(p3, 3, TOTAL, "Every day"),
    page(p4, 4, TOTAL, "The 0–5 scale"),
    page(p5, 5, TOTAL, "Every week"),
    page(p6, 6, TOTAL, "Every page"),
    page(p7, 7, TOTAL, "Your data"),
    page(p8, 8, TOTAL, "The short version"),
]

html = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>How to use Alina's Study Desk</title>
<style>
@font-face {{ font-family:'Fraunces'; src:url(data:font/woff2;base64,{FONTS['fraunces']}) format('woff2');
  font-weight:100 900; font-display:block; }}
@font-face {{ font-family:'Jakarta'; src:url(data:font/woff2;base64,{FONTS['jakarta']}) format('woff2');
  font-weight:100 900; font-display:block; }}

:root {{
  --bg:#fdf7ef; --surface:#fffdfa; --surface2:#f8ecdb; --surface3:#f2dfc6;
  --border:#eddcc3; --text:#3a2a1d; --soft:#6a5341; --muted:#8b7059;
  --accent:#e8620e; --accent2:#c74e08; --accentsoft:#fdeedc; --ink:#fffaf4;
  --good:#5f8c1f; --warn:#c2870b;
}}
* {{ box-sizing:border-box; margin:0; padding:0; }}
@page {{ size:A4; margin:0; }}
html,body {{ background:#fff; }}
body {{ font-family:'Jakarta',sans-serif; color:var(--text); -webkit-print-color-adjust:exact; print-color-adjust:exact; }}

.page {{
  width:210mm; height:297mm; padding:17mm 16mm 20mm; position:relative;
  background:var(--bg); page-break-after:always; overflow:hidden;
  display:flex; flex-direction:column;
}}
.page:last-child {{ page-break-after:auto; }}

.pfoot {{ position:absolute; left:16mm; right:16mm; bottom:8mm; display:flex;
  justify-content:space-between; font-size:8.5pt; font-weight:700; color:var(--muted);
  letter-spacing:.06em; text-transform:uppercase; }}

/* ---------- cover ---------- */
.page-cover {{ padding:0; }}
.cover {{ position:absolute; inset:0; display:flex; flex-direction:column; align-items:center;
  justify-content:center; text-align:center; overflow:hidden;
  background:linear-gradient(150deg,var(--accent) 0%,var(--accent2) 100%);
  color:var(--ink); }}
.cover-cat {{ width:104px; height:104px; color:var(--ink); margin-bottom:26px; }}
.cover-kicker {{ font-size:11pt; font-weight:800; letter-spacing:.22em; text-transform:uppercase; opacity:.82; }}
.cover-title {{ font-family:'Fraunces',serif; font-size:44pt; font-weight:700; line-height:1.03;
  margin:10px 0 18px; letter-spacing:-.02em; }}
.cover-sub {{ font-size:13pt; line-height:1.65; opacity:.93; font-weight:500; }}
.cover-url {{ margin-top:32px; font-size:10.5pt; font-weight:700; letter-spacing:.04em;
  border:2px solid rgba(255,250,244,.45); border-radius:999px; padding:9px 20px; }}
.cover-sleep {{ position:absolute; bottom:16mm; right:14mm; width:190px; color:var(--ink); opacity:.22; }}

/* ---------- headings ---------- */
.h2 {{ font-family:'Fraunces',serif; font-size:25pt; font-weight:700; letter-spacing:-.015em;
  margin-bottom:5px; display:flex; align-items:center; justify-content:space-between; }}
.h2-num {{ font-size:12pt; color:var(--accent); background:var(--accentsoft);
  width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; }}
.lead {{ font-size:10.5pt; color:var(--soft); line-height:1.6; margin-bottom:18px; }}
.mini {{ font-family:'Fraunces',serif; font-size:13pt; font-weight:700; margin-bottom:9px; }}
.mt {{ margin-top:18px; }}

/* ---------- steps ---------- */
.steps {{ display:flex; flex-direction:column; gap:15px; }}
.step {{ display:flex; gap:14px; background:var(--surface); border-radius:15px; padding:15px 17px;
  box-shadow:0 1px 3px rgba(88,52,22,.07); }}
.step-n {{ flex:0 0 32px; height:32px; border-radius:50%; background:var(--accent); color:var(--ink);
  font-family:'Fraunces',serif; font-weight:700; font-size:15pt;
  display:flex; align-items:center; justify-content:center; }}
.step h3 {{ font-family:'Fraunces',serif; font-size:13pt; margin-bottom:4px; }}
.step p {{ font-size:9.8pt; line-height:1.58; color:var(--soft); }}

/* ---------- callouts ---------- */
.callout {{ display:flex; gap:13px; align-items:flex-start; margin-top:17px;
  background:var(--surface2); border-radius:15px; padding:15px 17px;
  font-size:9.8pt; line-height:1.6; color:var(--soft); }}
.callout-warm {{ background:var(--accentsoft); }}
.callout b {{ color:var(--text); }}
.callout-ico {{ flex:0 0 24px; height:24px; color:var(--accent); }}

/* ---------- levels ---------- */
.lvbox {{ background:var(--surface); border-radius:17px; padding:17px 19px;
  box-shadow:0 1px 3px rgba(88,52,22,.07); }}
.lvbox.compact {{ padding:14px 16px; margin-top:16px; }}
.lv-h {{ font-family:'Fraunces',serif; font-weight:700; font-size:11.5pt; margin-bottom:9px; }}
.lvrow {{ display:flex; align-items:center; gap:14px; padding:9px 0;
  border-bottom:1px solid var(--border); }}
.lvrow:last-child {{ border-bottom:none; }}
.lvchip {{ flex:none; border-radius:9px; color:#fff; font-weight:800;
  display:flex; align-items:center; justify-content:center; }}
.lvlabel {{ font-size:10.5pt; color:var(--text); font-weight:600; }}

/* ---------- mock UI ---------- */
.grid2 {{ display:grid; grid-template-columns:1fr 1fr; gap:15px; }}
.grid2.tight {{ gap:12px; }}
.mock {{ background:var(--surface); border-radius:15px; padding:12px; box-shadow:0 1px 3px rgba(88,52,22,.07); }}
.mock-hero {{ background:linear-gradient(135deg,var(--accent),var(--accent2)); color:var(--ink);
  border-radius:12px; padding:14px 15px; position:relative; overflow:hidden; }}
.mock-eyebrow {{ font-size:6.5pt; font-weight:800; letter-spacing:.13em; opacity:.8; }}
.mock-days {{ font-family:'Fraunces',serif; font-size:12pt; font-weight:700; margin-top:3px; }}
.mock-num {{ font-size:30pt; }}
.mock-sub {{ font-size:8pt; opacity:.9; margin-top:3px; font-weight:600; }}
.mock-hero-cat {{ position:absolute; right:-8px; bottom:-8px; width:82px; color:var(--ink); opacity:.28; }}
.mock-stats {{ display:grid; grid-template-columns:1fr 1fr; gap:7px; margin-top:9px; }}
.mock-stats div {{ background:var(--surface2); border-radius:10px; padding:8px 9px; }}
.ms-l {{ display:block; font-size:6.5pt; font-weight:800; letter-spacing:.1em; color:var(--muted); }}
.ms-v {{ display:block; font-family:'Fraunces',serif; font-size:14pt; font-weight:700; margin-top:2px; }}

.daylist {{ background:var(--surface); border-radius:15px; padding:15px 17px; box-shadow:0 1px 3px rgba(88,52,22,.07); }}
.checks {{ list-style:none; counter-reset:c; }}
.checks li {{ counter-increment:c; position:relative; padding-left:26px; margin-bottom:11px;
  font-size:9.6pt; line-height:1.55; color:var(--soft); }}
.checks li::before {{ content:counter(c); position:absolute; left:0; top:1px; width:17px; height:17px;
  border-radius:50%; background:var(--accentsoft); color:var(--accent2);
  font-size:8pt; font-weight:800; display:flex; align-items:center; justify-content:center; }}
.checks b {{ color:var(--text); }}

.infobox {{ background:var(--surface); border-radius:15px; padding:14px 16px;
  box-shadow:0 1px 3px rgba(88,52,22,.07); font-size:9.4pt; line-height:1.55; color:var(--soft); }}
.infobox.tall {{ height:100%; }}
.infobox > b {{ display:block; font-family:'Fraunces',serif; font-size:11.5pt; color:var(--text); margin-bottom:8px; }}
.ib-h {{ font-size:12.5pt !important; }}
.infobox p {{ margin-bottom:8px; }}
.infobox p:last-child {{ margin-bottom:0; }}
.warn {{ background:var(--accentsoft); border-radius:10px; padding:10px 12px; margin-top:10px; font-size:9pt; }}
.warn b {{ color:var(--accent2); }}

.barsdemo {{ display:flex; align-items:flex-end; gap:3px; height:42px; margin:4px 0 9px; }}
.barsdemo span {{ flex:1; background:var(--accent); border-radius:3px; opacity:.85; }}
.pctdemo {{ display:flex; justify-content:space-between; align-items:baseline; margin:2px 0 5px; }}
.pctdemo span {{ font-weight:700; color:var(--text); font-size:10pt; }}
.pctdemo b {{ font-family:'Fraunces',serif; font-size:16pt; color:var(--accent); }}
.pctbar {{ height:8px; background:var(--surface3); border-radius:99px; overflow:hidden; margin-bottom:9px; }}
.pctbar i {{ display:block; height:100%; background:var(--accent); }}

/* ---------- weekly ---------- */
.wk {{ display:flex; gap:14px; background:var(--surface); border-radius:15px; padding:17px 19px;
  margin-bottom:15px; box-shadow:0 1px 3px rgba(88,52,22,.07); }}
.wk-i {{ flex:0 0 26px; height:26px; color:var(--accent); }}
.wk h3 {{ font-family:'Fraunces',serif; font-size:13pt; margin-bottom:5px; }}
.wk p {{ font-size:9.7pt; line-height:1.58; color:var(--soft); margin-bottom:6px; }}
.wk p:last-child {{ margin-bottom:0; }}
.small {{ font-size:9pt !important; color:var(--muted) !important; }}
.ticks {{ list-style:none; margin-top:4px; }}
.ticks li {{ position:relative; padding-left:17px; font-size:9.5pt; line-height:1.55;
  color:var(--soft); margin-bottom:5px; }}
.ticks li::before {{ content:''; position:absolute; left:0; top:7px; width:7px; height:7px;
  border-radius:50%; background:var(--accent); }}
.ticks b {{ color:var(--text); }}

/* ---------- table ---------- */
.tbl {{ width:100%; border-collapse:collapse; background:var(--surface); border-radius:15px;
  overflow:hidden; box-shadow:0 1px 3px rgba(88,52,22,.07); }}
.tbl th {{ text-align:left; font-size:7.5pt; letter-spacing:.1em; text-transform:uppercase;
  color:var(--muted); padding:9px 14px; background:var(--surface2); }}
.tbl td {{ padding:9.5px 14px; font-size:9.3pt; line-height:1.45; color:var(--soft);
  border-top:1px solid var(--border); vertical-align:top; }}
.tbl td:first-child {{ width:32%; color:var(--text); }}
.small-tbl td {{ font-size:9pt; padding:7px 14px; }}
.small-tbl td:first-child {{ width:38%; }}

/* ---------- final ---------- */
.grid3 {{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }}
.fp {{ font-size:9pt; line-height:1.55; color:var(--soft); }}
.fp b {{ color:var(--text); }}
.finalgrid {{ display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }}
.fcard {{ background:var(--surface); border-radius:15px; padding:14px;
  box-shadow:0 1px 3px rgba(88,52,22,.07); }}
.fc-k {{ display:block; font-size:7.5pt; font-weight:800; letter-spacing:.13em;
  color:var(--accent); margin-bottom:9px; }}
.fcard ul {{ list-style:none; }}
.fcard li {{ font-size:9.2pt; line-height:1.5; color:var(--soft); padding-left:13px;
  position:relative; margin-bottom:7px; }}
.fcard li::before {{ content:''; position:absolute; left:0; top:6px; width:5px; height:5px;
  border-radius:50%; background:var(--accent); opacity:.6; }}
.fcard b {{ color:var(--text); }}

.closing {{ margin-top:auto; text-align:center; position:relative; padding:14px 0 0; }}
.closing-cat {{ width:120px; margin:0 auto 12px; color:var(--accent); opacity:.92; }}
.closing p {{ font-family:'Fraunces',serif; font-size:13.5pt; line-height:1.6; color:var(--soft); }}
.closing b {{ color:var(--accent2); }}
</style></head>
<body>
{''.join(pages)}
</body></html>
"""

OUT.write_text(html, encoding="utf-8")
print(f"wrote {OUT}  ({len(html)/1024:.0f} KB)")
