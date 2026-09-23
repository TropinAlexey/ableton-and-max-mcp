# ADR-008: Musical Domain — Pattern Generation Scope

**Status:** Accepted  
**Date:** 2026-09-22

## Decision

### Patterns
- `arpeggio_up`, `arpeggio_down` — scale-based arpeggios
- `chord` — chord voicing from scale degrees, chord type catalog, or custom degrees
- `random` — random notes from scale with varied velocity and optional octave shifts

### Scales (60+)
Full catalog: all 7 modes (ionian through locrian), harmonic/melodic minor, pentatonic major/minor, blues, chromatic, whole tone, diminished (both forms), augmented, Hungarian, gypsy, phrygian dominant, double harmonic, flamenco, enigmatic, Neapolitan, Persian, Arabic, Romanian, Ukrainian dorian, Japanese (hirajoshi, in-sen, iwato, kumoi, yo), Indian (bhairav, purvi, marwa, todi), bebop (dominant, major, minor, dorian), lydian variants (augmented, dominant, minor), super locrian/altered, prometheus, tritone, acoustic, Algerian, Balinese, Chinese, Egyptian, Ethiopian, Hawaiian, Hindu, Mongolian, Spanish.

### Chord Types (30+)
Power, triads (major, minor, dim, aug, sus2, sus4), seventh chords (8 types including dom7sus4/sus2), sixths, ninths (incl. b9, #9, add9, 6/9), elevenths, thirteenths, dom7#11.

### Custom Degrees
`degrees` parameter accepts 1-based scale degree numbers, allowing any voicing: `[1, 3, 5, 7]` for seventh chord from current scale, `[1, 5, 8]` for octave-spanning voicing, etc. Degrees beyond the scale length wrap into higher octaves.

### Removed
- `tempo` parameter — dead code, tempo is a transport property, not a pattern property

### Time units
- Positions: beats (universal, works in any time signature)
- Lengths: bars (for clip length), beats (for note duration)

## Rationale

The goal is the most flexible music generation tool possible. An AI agent should be able to describe any common musical pattern and have it generated. Custom degrees provide an escape hatch for voicings not covered by the chord type catalog.
