// Add a new project by appending another object to this list.
window.PROJECTS = [
  {
    "id": "loamlight",
    "image": "covers/loamlight.jpg",
    "title": "Loamlight",
    "blurb": "Fifteen tracks for a blocky sandbox game, made entirely by code. No samples, no soundfonts and no AI audio: every waveform is computed from scratch. One eight-bar melody hides in every track, re-voiced for each biome in its own mode, tempo and instrument.",
    "audio": "audio/loamlight/",
    "tracks": [
      {
        "file": "01_first_light.mp3",
        "title": "First Light",
        "where": "Title screen",
        "seconds": 112,
        "sound": "Felt piano, glass and a warm pad. States the main theme plainly."
      },
      {
        "file": "02_soft_loam.mp3",
        "title": "Soft Loam",
        "where": "Plains, daytime",
        "seconds": 183,
        "sound": "Sparse, wobbly tape piano in G Lydian."
      },
      {
        "file": "03_understory.mp3",
        "title": "Understory",
        "where": "Forest",
        "seconds": 146,
        "sound": "6/8 harp, flute, kalimba and birdsong, in A Dorian."
      },
      {
        "file": "04_saltwind.mp3",
        "title": "Saltwind",
        "where": "Ocean and shore",
        "seconds": 166,
        "sound": "Swelling pads, vibraphone, surf and distant whales."
      },
      {
        "file": "05_deep_stone.mp3",
        "title": "Deep Stone",
        "where": "Caves",
        "seconds": 174,
        "sound": "Drone, drips, far-off piano and a detuned music box."
      },
      {
        "file": "06_snowmelt.mp3",
        "title": "Snowmelt",
        "where": "Tundra",
        "seconds": 136,
        "sound": "Music-box waltz with celesta and strings."
      },
      {
        "file": "07_dune_glass.mp3",
        "title": "Dune Glass",
        "where": "Desert",
        "seconds": 149,
        "sound": "Oud and flute over frame drum, Phrygian dominant."
      },
      {
        "file": "08_hearthside.mp3",
        "title": "Hearthside",
        "where": "Village",
        "seconds": 133,
        "sound": "Fingerpicked folk tune with a fire crackling."
      },
      {
        "file": "09_lanternfall.mp3",
        "title": "Lanternfall",
        "where": "Night",
        "seconds": 154,
        "sound": "Low strings, a heartbeat, crickets, the theme in minor."
      },
      {
        "file": "10_ember_hollow.mp3",
        "title": "Ember Hollow",
        "where": "The underworld",
        "seconds": 156,
        "sound": "Distorted drone, choir, taiko, fire and lava."
      },
      {
        "file": "11_mineshaft_run.mp3",
        "title": "Mineshaft Run",
        "where": "Minecart chase",
        "seconds": 117,
        "sound": "138 bpm arps, drums and a brass lead."
      },
      {
        "file": "12_the_quiet_beyond.mp3",
        "title": "The Quiet Beyond",
        "where": "The edge of the world",
        "seconds": 183,
        "sound": "Whole-tone choir, reversed piano and static."
      },
      {
        "file": "13_old_warden.mp3",
        "title": "Old Warden",
        "where": "Boss fight",
        "seconds": 128,
        "sound": "7/8 taiko ostinato, brass and choir."
      },
      {
        "file": "14_disc_cobalt.mp3",
        "title": "Disc: Cobalt",
        "where": "Jukebox music disc",
        "seconds": 101,
        "sound": "Bit-crushed chiptune with a key change."
      },
      {
        "file": "15_long_way_home.mp3",
        "title": "Long Way Home",
        "where": "Credits",
        "seconds": 165,
        "sound": "The full ensemble reprise, modulating up a tone."
      }
    ]
  },
  {
    "id": "first-light",
    "image": "covers/first-light.jpg",
    "cover": ["#3b3a5a", "#b9797a", "#f8d68e", "#4b7059", "#3a2a26"],
    "title": "First Light",
    "blurb": "A five-minute piece for full orchestra, written as a score and rendered with Muse Sounds.",
    "audio": "audio/first-light/",
    "scores": "scores/first-light/",
    "score": "score.pdf",
    "parts": [
      { "name": "Flute", "kind": "flute", "file": "part-flute.pdf" },
      { "name": "Oboe", "kind": "oboe", "file": "part-oboe.pdf" },
      { "name": "Clarinet in B♭", "kind": "clarinet", "file": "part-clarinet-in-bb.pdf" },
      { "name": "Bassoon", "kind": "bassoon", "file": "part-bassoon.pdf" },
      { "name": "Horns", "kind": "horn", "file": "part-horns.pdf" },
      { "name": "Trumpets in B♭", "kind": "trumpet", "file": "part-trumpets-in-bb.pdf" },
      { "name": "Trombones", "kind": "trombone", "file": "part-trombones.pdf" },
      { "name": "Timpani", "kind": "timpani", "file": "part-timpani.pdf" },
      { "name": "Harp", "kind": "harp", "file": "part-harp.pdf" },
      { "name": "Violin I", "kind": "violin-1", "file": "part-violin-i.pdf" },
      { "name": "Violin II", "kind": "violin-2", "file": "part-violin-ii.pdf" },
      { "name": "Viola", "kind": "viola", "file": "part-viola.pdf" },
      { "name": "Cello", "kind": "cello", "file": "part-cello.pdf" },
      { "name": "Double Bass", "kind": "bass", "file": "part-double-bass.pdf" }
    ],
    "tracks": [
      {
        "file": "first_light.mp3",
        "title": "First Light",
        "where": "Full orchestra",
        "seconds": 301,
        "sound": "Woodwinds, brass, timpani, harp and strings."
      }
    ]
  },
  {
    "id": "landfall",
    "image": "covers/landfall.jpg",
    "cover": [
      "#1f2a44",
      "#3d5a7a",
      "#f1ead6",
      "#4b7059",
      "#2a2f3a"
    ],
    "title": "Landfall",
    "blurb": "A piece for large orchestra, organ and wordless chorus in five movements, made entirely by code. No samples, no soundfonts and no AI audio: every waveform is computed from scratch, and the sheet music is engraved from the same code.",
    "audio": "audio/landfall/",
    "scores": "scores/landfall/",
    "score": "score.pdf",
    "parts": [
      {
        "name": "Flutes",
        "kind": "flute",
        "file": "part-flutes.pdf"
      },
      {
        "name": "Oboes",
        "kind": "oboe",
        "file": "part-oboes.pdf"
      },
      {
        "name": "Cor anglais",
        "kind": "cor-anglais",
        "file": "part-cor-anglais.pdf"
      },
      {
        "name": "Clarinets",
        "kind": "clarinet",
        "file": "part-clarinets.pdf"
      },
      {
        "name": "Bassoons",
        "kind": "bassoon",
        "file": "part-bassoons.pdf"
      },
      {
        "name": "Horns",
        "kind": "horn",
        "file": "part-horns.pdf"
      },
      {
        "name": "Trumpets",
        "kind": "trumpet",
        "file": "part-trumpets.pdf"
      },
      {
        "name": "Trombones",
        "kind": "trombone",
        "file": "part-trombones.pdf"
      },
      {
        "name": "Tuba",
        "kind": "tuba",
        "file": "part-tuba.pdf"
      },
      {
        "name": "Timpani",
        "kind": "timpani",
        "file": "part-timpani.pdf"
      },
      {
        "name": "Snare Drum",
        "kind": "snare",
        "file": "part-snare-drum.pdf"
      },
      {
        "name": "Bass Drum",
        "kind": "bass-drum",
        "file": "part-bass-drum.pdf"
      },
      {
        "name": "Cymbals",
        "kind": "cymbals",
        "file": "part-cymbals.pdf"
      },
      {
        "name": "Tam-tam",
        "kind": "tam-tam",
        "file": "part-tam-tam.pdf"
      },
      {
        "name": "Glockenspiel",
        "kind": "glockenspiel",
        "file": "part-glockenspiel.pdf"
      },
      {
        "name": "Harp",
        "kind": "harp",
        "file": "part-harp.pdf"
      },
      {
        "name": "Organ",
        "kind": "organ",
        "file": "part-organ.pdf"
      },
      {
        "name": "Sopranos and Altos",
        "kind": "choir-high",
        "file": "part-sopranos-and-altos.pdf"
      },
      {
        "name": "Tenors and Basses",
        "kind": "choir-low",
        "file": "part-tenors-and-basses.pdf"
      },
      {
        "name": "Violins I",
        "kind": "violin-1",
        "file": "part-violins-i.pdf"
      },
      {
        "name": "Violins II",
        "kind": "violin-2",
        "file": "part-violins-ii.pdf"
      },
      {
        "name": "Violas",
        "kind": "viola",
        "file": "part-violas.pdf"
      },
      {
        "name": "Cellos",
        "kind": "cello",
        "file": "part-cellos.pdf"
      },
      {
        "name": "Double Basses",
        "kind": "bass",
        "file": "part-double-basses.pdf"
      }
    ],
    "tracks": [
      {
        "file": "landfall.mp3",
        "title": "Landfall",
        "where": "Orchestra, organ and chorus",
        "seconds": 288,
        "sound": "Five movements, played without a break.",
        "marks": [
          {
            "num": "I",
            "title": "Orbit",
            "at": 1,
            "note": "A quiet organ figure in 3/4 over a slow bass; strings, horn, then full organ, brass and chorus pile on."
          },
          {
            "num": "II",
            "title": "Largo",
            "at": 63,
            "note": "A soft brass chorale, then a cor anglais sings over muted strings and harp."
          },
          {
            "num": "III",
            "title": "Con fuoco",
            "at": 126,
            "note": "A driving string ostinato, a march on horns and trumpets, a fanfare, then a battle."
          },
          {
            "num": "IV",
            "title": "Maestoso",
            "at": 203,
            "note": "The main theme in D major for everyone, with the opening organ figure underneath."
          },
          {
            "num": "V",
            "title": "First night",
            "at": 247,
            "note": "The organ figure alone, the cor anglais and horn remembering, and one last held chord."
          }
        ]
      }
    ]
  }
];
