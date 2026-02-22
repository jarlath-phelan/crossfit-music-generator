# Crank User Testing Kit

**Version**: 1.0
**App URL**: https://crossfit-music-generator.vercel.app
**Date**: 2026-02-22

---

## 1. Participant Screener

Text these questions to potential testers before the session. Aim for 3-5 people with a mix of profiles.

| # | Question | Ideal Mix |
|---|----------|-----------|
| 1 | Do you do CrossFit? How often? | 2 regulars (3+/week), 2 casual (1-2/week), 1 who's done a few classes |
| 2 | Do you have Spotify? Free or Premium? | At least 1 Premium, 1 Free, 1 non-Spotify |
| 3 | How do you pick music for workouts now? | Mix of "I don't", playlist apps, coach picks, Spotify radio |
| 4 | What phone will you use? | iPhone + Android if possible |
| 5 | Would you be up for 15-20 minutes of testing? | Yes |

**Disqualify if**: They've seen you build Crank or know how it works. Fresh eyes only.

---

## 2. Session Setup (2 min)

Read this to each participant:

> "I'm testing an app I've been building. It makes playlists matched to CrossFit workouts. I want to see how you'd use it — there are no wrong answers and you can't break anything. I didn't design the UX so don't worry about hurting my feelings. If something is confusing, that's the app's fault, not yours.
>
> As you go, try to think out loud — tell me what you're looking at, what you expect to happen, and what you're thinking. I'll give you a few things to try, but I won't help you figure them out. Ready?"

**Before you start:**
- Have them open the app URL in their phone browser (Safari or Chrome)
- Make sure they are NOT signed in initially
- Clear any previous localStorage if they've used it before (or use private/incognito)
- Start screen recording on their phone if they're comfortable with it

---

## 3. Task Scenarios

### Task 1: First Impressions (2 min)

**Say**: "Take a look at this app. Don't tap anything yet — just tell me what you think it does and what you'd do first."

**Watch for**:
- Do they understand the value prop from the hero text?
- Do they notice the onboarding modal? Do they read it or skip it?
- Does "Drop your WOD" language feel natural or confusing?
- Do they understand the named WOD buttons (Fran, Murph, etc.)?

**Success**: They can articulate "it makes playlists for workouts" without prompting.

---

### Task 2: Generate a Playlist — Named WOD (3 min)

**Say**: "You're about to do Fran at the gym. You want some music to go with it. Use this app to get a playlist."

**Watch for**:
- Do they tap "Fran" or try to type it?
- Do they notice the genre chips? Do they pick one or leave the default?
- Do they read the "Pick your genre" label?
- How do they react to the 30-40 second loading time? Do they notice the progress stages?
- Do they try the Cancel button?
- What's their reaction when results appear?

**Success**: They tap Fran, optionally pick a genre, tap Generate, and see results.

**SEQ after**: "On a scale of 1 to 7, how easy was that?"

---

### Task 3: Explore the Results (2 min)

**Say**: "Take a look at what came back. Tell me what you see and what you understand."

**Watch for**:
- Do they understand the phase grouping (Warm Up, Main Work, Cooldown)?
- Do they collapse/expand phase sections?
- Do they notice the intensity arc and metrics bar (duration, tracks, peak BPM)?
- Do they try to tap a track? What do they expect to happen?
- Do they scroll to see all tracks?

**Success**: They can identify the workout phases and the tracks matched to each.

---

### Task 4: Change the Genre (2 min)

**Say**: "The playlist came back but you'd prefer Hip-Hop instead. Change the genre and get a new playlist."

**Watch for**:
- Do they find the Edit button or Remix button?
- Do they understand Edit vs Remix vs New?
- Can they change the genre chip?
- Do they notice the "Back to results" option?
- Is the flow of edit-then-regenerate intuitive?

**Success**: They change the genre and regenerate successfully.

**SEQ after**: "On a scale of 1 to 7, how easy was that?"

---

### Task 5: Custom Workout (3 min)

**Say**: "Tomorrow's workout at your box is a custom one — not a named WOD. How would you get a playlist for it?"

If they need a prompt: "The workout is: 3 rounds of 400m run, 15 wall balls, 10 box jumps, then a 1 mile run to finish. About 25 minutes."

**Watch for**:
- Do they tap "New" first? Are they hesitant (confirmation dialog)?
- Do they find the text input and type the workout?
- Do they try photo mode? (Ask them about it even if they don't)
- Is the textarea big enough?
- Do they understand the photo mode option?

**Success**: They type (or dictate) a custom workout, pick a genre, and generate.

**SEQ after**: "On a scale of 1 to 7, how easy was that?"

---

### Task 6: Track Feedback (1 min, auth required)

**If they're signed in**, say: "There's a song in there you don't like. What would you do about it?"

**If they're NOT signed in**, say: "You love one of these songs. Is there a way to tell the app?"

**Watch for**:
- Do they discover the thumbs up/down buttons?
- Do they understand what feedback does? (Do they expect the track to disappear?)
- If not signed in, do they see the sign-in prompt? Is the auth flow clear?
- Do they try the Spotify link icon?

**Success**: They either use thumbs up/down or understand they need to sign in.

---

### Task 7: Play Music (2 min, Spotify users only)

**Say**: "You want to listen to this playlist while working out. How would you do that?"

**Watch for**:
- Do they try tapping a track to play it?
- If not signed in: do they sign in via Spotify OAuth? Is the flow smooth?
- If Spotify Free: what happens? Do they see the Premium error message? Is it clear?
- If Spotify Premium: does playback start? Do they notice the mini-player?
- Do they try skip/previous? Does it work?
- Do they understand the seek slider?

**Success**: Premium users play a track. Free/non-Spotify users understand the limitation.

**SEQ after**: "On a scale of 1 to 7, how easy was that?"

---

### Task 8: Save or Export (1 min, auth required)

**Say**: "You like this playlist. What can you do with it?"

**Watch for**:
- Do they find Save to Library?
- Do they find Export to Spotify?
- Do they understand the difference?
- What do they expect "Save" to do? (keep in app vs download?)

**Success**: They identify one or both save/export options.

---

## 4. Post-Task Discussion (5 min)

### Overall Impressions

1. "What was your overall impression of the app?"
2. "What was the best part?"
3. "What was the most frustrating part?"
4. "Would you use this before your next workout? Why or why not?"
5. "If you could change one thing, what would it be?"

### Specific Probes

6. "The playlist took about 30-40 seconds to generate. How did that feel?"
7. "Did you understand why the tracks were grouped by workout phase?"
8. "What did you think of the genre options? Was yours there?"
9. "Did you notice the intensity chart at the top? What did you think it showed?"
10. "Is there anything you expected the app to do that it didn't?"

### Competitive Context

11. "How does this compare to how you pick workout music now?"
12. "Would you tell a friend about this? How would you describe it?"

---

## 5. SUS Questionnaire

After all tasks, have them rate each statement 1-5 (1 = Strongly Disagree, 5 = Strongly Agree):

| # | Statement |
|---|-----------|
| 1 | I think that I would like to use this system frequently |
| 2 | I found the system unnecessarily complex |
| 3 | I thought the system was easy to use |
| 4 | I think that I would need the support of a technical person to use this system |
| 5 | I found the various functions in this system were well integrated |
| 6 | I thought there was too much inconsistency in this system |
| 7 | I would imagine that most people would learn to use this system very quickly |
| 8 | I found the system very cumbersome to use |
| 9 | I felt very confident using the system |
| 10 | I needed to learn a lot of things before I could get going with this system |

**Scoring formula**:
- Odd questions (1,3,5,7,9): score minus 1
- Even questions (2,4,6,8,10): 5 minus score
- Sum all 10 adjusted scores, multiply by 2.5
- **Range**: 0-100. **Average**: 68. **Above 80**: Excellent.

---

## 6. Note-Taking Template

Copy this for each participant:

```
================================================================
PARTICIPANT: _______________
DATE: _______________
DEVICE: _______________ (iPhone/Android, model)
SPOTIFY: Free / Premium / None / Apple Music
CROSSFIT: ___ months/years, ___ times/week
CURRENT MUSIC SETUP: _______________
================================================================

TASK 1: First Impressions
- Understood value prop: Y / N
- Noticed onboarding: Y / N / Skipped
- First words: "_______________"
- Observations:

TASK 2: Generate (Named WOD)
- Completed: Y / N / Partial
- Time to complete: ___
- SEQ (1-7): ___
- Used WOD button: Y / N (typed instead)
- Picked genre: Y / N (which: ___)
- Loading reaction:
- Observations:

TASK 3: Explore Results
- Understood phases: Y / N / Partial
- Collapsed/expanded sections: Y / N
- Noticed metrics bar: Y / N
- Tried to play a track: Y / N
- Observations:

TASK 4: Change Genre
- Completed: Y / N / Partial
- Time to complete: ___
- SEQ (1-7): ___
- Used: Edit / Remix / New / confused
- Observations:

TASK 5: Custom Workout
- Completed: Y / N / Partial
- Time to complete: ___
- SEQ (1-7): ___
- Input method: typed / dictated / photo
- Noticed photo mode: Y / N
- Observations:

TASK 6: Track Feedback
- Found thumbs buttons: Y / N
- Expected behavior: ___
- Auth barrier hit: Y / N
- Observations:

TASK 7: Play Music (Spotify users)
- Completed: Y / N / Partial / N/A
- SEQ (1-7): ___
- Auth flow: smooth / confused / failed
- Premium wall hit: Y / N
- Mini-player found: Y / N
- Skip/previous used: Y / N
- Observations:

TASK 8: Save/Export
- Found Save: Y / N
- Found Export to Spotify: Y / N
- Understood difference: Y / N
- Observations:

POST-TASK DISCUSSION:
- Overall impression:
- Best part:
- Most frustrating:
- Would use again: Y / N / Maybe
- #1 change request:
- Loading time reaction:
- Would tell a friend: Y / N
- How they'd describe it:

SUS SCORES:
Q1: __ Q2: __ Q3: __ Q4: __ Q5: __
Q6: __ Q7: __ Q8: __ Q9: __ Q10: __
TOTAL SUS SCORE: ___

ADDITIONAL QUOTES / OBSERVATIONS:
```

---

## 7. Synthesis Template

After all sessions, compile findings here:

```
================================================================
CRANK USABILITY TEST — SYNTHESIS
Date range: ___
Participants: ___ (N)
================================================================

TASK COMPLETION RATES:
| Task | Completed | Partial | Failed | Avg SEQ |
|------|-----------|---------|--------|---------|
| T2: Named WOD |  /  |  /  |  /  |  .  |
| T4: Change genre |  /  |  /  |  /  |  .  |
| T5: Custom workout |  /  |  /  |  /  |  .  |
| T7: Play music |  /  |  /  |  /  |  .  |

SUS SCORES:
- Participant 1: ___
- Participant 2: ___
- Participant 3: ___
- Average: ___  (benchmark: 68, excellent: 80+)

TOP 5 ISSUES (by frequency):
1. [Issue] — seen in _/_ participants
2. [Issue] — seen in _/_ participants
3. [Issue] — seen in _/_ participants
4. [Issue] — seen in _/_ participants
5. [Issue] — seen in _/_ participants

TOP 3 DELIGHTS:
1. [What worked] — mentioned by _ participants
2. [What worked] — mentioned by _ participants
3. [What worked] — mentioned by _ participants

SPOTIFY PREMIUM WALL:
- _/_ participants hit the Premium requirement
- Reaction:
- Did the error message help: Y / N

LOADING TIME (30-40s):
- Average reaction (1=fine, 5=unacceptable): ___
- Quotes about loading:

GENRE CHIPS:
- _/_ participants changed genre from default
- Missing genres requested:

PHASE GROUPING:
- _/_ participants understood phase-matched tracks
- _/_ collapsed/expanded sections

KEY RECOMMENDATIONS:
1. [Priority 1 — do immediately]
2. [Priority 2 — do this sprint]
3. [Priority 3 — backlog]
```

---

## 8. Quick-Reference Cheat Sheet

Print or keep this on your phone during sessions.

### Moderator Reminders
- **Never help.** Ask "What would you try next?" not "Try clicking there."
- **Encourage thinking aloud.** "Tell me what you're looking at."
- **Stay neutral.** No "good job!" or wincing.
- **Watch, don't just listen.** What they DO matters more than what they SAY.
- **Record the screen** if they agree.
- **Time each task** with your phone stopwatch.

### Known Issues to Watch For
- Generation takes 30-40 seconds (expected, watch reactions)
- Spotify Free users will hit Premium wall on playback
- Photo mode requires camera permissions
- First visit shows onboarding modal (might confuse task flow)
- Skip/Previous buttons require all playlist URIs (fixed in latest build)

### Quick Task Order
1. First impressions (look, don't touch)
2. Fran + genre → Generate
3. Explore results
4. Change genre (Edit or Remix)
5. Custom workout (type/photo)
6. Track feedback (thumbs)
7. Play music (Spotify)
8. Save/Export

### After Each Task
Ask: "On a scale of 1 to 7, how easy was that?"
Ask: "Was anything confusing?"

### Emergency Fallbacks
- If generation fails: "That's a real bug — good find! Let's move on to the next task."
- If Spotify auth fails: Skip Task 7, note the error.
- If they get stuck: Wait 30 seconds, then ask "What are you thinking?" If still stuck after 60 seconds, ask "What would you try next?" If still stuck, move on.
