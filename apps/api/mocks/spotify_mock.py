"""
Mock Spotify API implementation with in-memory track database
Provides realistic rock tracks across different BPM ranges
"""
from typing import Optional
from models.schemas import Track


class MockSpotifyClient:
    """Mock Spotify client with curated rock track database"""
    
    # In-memory database of tracks (Rob Miller's rock preference)
    TRACK_DATABASE = [
        # Warm-up tracks (100-120 BPM)
        Track(id="1", name="Use Somebody", artist="Kings of Leon", bpm=103, energy=0.52, 
              duration_ms=230000, spotify_url="https://open.spotify.com/track/use_somebody"),
        Track(id="2", name="Wonderwall", artist="Oasis", bpm=107, energy=0.48,
              duration_ms=258000, spotify_url="https://open.spotify.com/track/wonderwall"),
        Track(id="3", name="Fake Plastic Trees", artist="Radiohead", bpm=110, energy=0.45,
              duration_ms=290000, spotify_url="https://open.spotify.com/track/fake_plastic"),
        Track(id="4", name="Yellow", artist="Coldplay", bpm=112, energy=0.55,
              duration_ms=266000, spotify_url="https://open.spotify.com/track/yellow"),
        Track(id="5", name="Soul Shine", artist="The Allman Brothers Band", bpm=115, energy=0.58,
              duration_ms=422000, spotify_url="https://open.spotify.com/track/soul_shine"),
        
        # Low intensity (120-130 BPM)
        Track(id="6", name="Are You Gonna Be My Girl", artist="Jet", bpm=122, energy=0.65,
              duration_ms=214000, spotify_url="https://open.spotify.com/track/jet_girl"),
        Track(id="7", name="Float On", artist="Modest Mouse", bpm=125, energy=0.62,
              duration_ms=208000, spotify_url="https://open.spotify.com/track/float_on"),
        Track(id="8", name="Seven Nation Army", artist="The White Stripes", bpm=124, energy=0.68,
              duration_ms=231000, spotify_url="https://open.spotify.com/track/seven_nation"),
        Track(id="9", name="Learn to Fly", artist="Foo Fighters", bpm=127, energy=0.70,
              duration_ms=238000, spotify_url="https://open.spotify.com/track/learn_fly"),
        Track(id="10", name="Kryptonite", artist="3 Doors Down", bpm=126, energy=0.67,
               duration_ms=233000, spotify_url="https://open.spotify.com/track/kryptonite"),
        
        # Moderate intensity (130-145 BPM)
        Track(id="11", name="Everlong", artist="Foo Fighters", bpm=133, energy=0.75,
              duration_ms=250000, spotify_url="https://open.spotify.com/track/everlong"),
        Track(id="12", name="Plush", artist="Stone Temple Pilots", bpm=135, energy=0.72,
              duration_ms=310000, spotify_url="https://open.spotify.com/track/plush"),
        Track(id="13", name="Interstate Love Song", artist="Stone Temple Pilots", bpm=138, energy=0.77,
              duration_ms=194000, spotify_url="https://open.spotify.com/track/interstate"),
        Track(id="14", name="Come As You Are", artist="Nirvana", bpm=137, energy=0.74,
              duration_ms=219000, spotify_url="https://open.spotify.com/track/come_as_you"),
        Track(id="15", name="Black Hole Sun", artist="Soundgarden", bpm=140, energy=0.70,
              duration_ms=318000, spotify_url="https://open.spotify.com/track/black_hole"),
        Track(id="16", name="Cherub Rock", artist="The Smashing Pumpkins", bpm=142, energy=0.80,
              duration_ms=298000, spotify_url="https://open.spotify.com/track/cherub_rock"),
        Track(id="17", name="The Middle", artist="Jimmy Eat World", bpm=144, energy=0.82,
              duration_ms=166000, spotify_url="https://open.spotify.com/track/the_middle"),
        
        # High intensity (145-160 BPM)
        Track(id="18", name="Mr. Brightside", artist="The Killers", bpm=148, energy=0.89,
              duration_ms=223000, spotify_url="https://open.spotify.com/track/mr_brightside"),
        Track(id="19", name="Times Like These", artist="Foo Fighters", bpm=147, energy=0.85,
              duration_ms=266000, spotify_url="https://open.spotify.com/track/times_like"),
        Track(id="20", name="In Bloom", artist="Nirvana", bpm=150, energy=0.87,
              duration_ms=255000, spotify_url="https://open.spotify.com/track/in_bloom"),
        Track(id="21", name="Smells Like Teen Spirit", artist="Nirvana", bpm=152, energy=0.91,
              duration_ms=301000, spotify_url="https://open.spotify.com/track/teen_spirit"),
        Track(id="22", name="Song 2", artist="Blur", bpm=155, energy=0.93,
              duration_ms=122000, spotify_url="https://open.spotify.com/track/song_2"),
        Track(id="23", name="All My Life", artist="Foo Fighters", bpm=153, energy=0.90,
              duration_ms=263000, spotify_url="https://open.spotify.com/track/all_my_life"),
        Track(id="24", name="Sabotage", artist="Beastie Boys", bpm=158, energy=0.95,
              duration_ms=179000, spotify_url="https://open.spotify.com/track/sabotage"),
        Track(id="25", name="Bulls On Parade", artist="Rage Against The Machine", bpm=157, energy=0.94,
              duration_ms=229000, spotify_url="https://open.spotify.com/track/bulls_parade"),
        
        # Very high intensity (160-175 BPM)
        Track(id="26", name="Killing in the Name", artist="Rage Against The Machine", bpm=162, energy=0.97,
              duration_ms=314000, spotify_url="https://open.spotify.com/track/killing_name"),
        Track(id="27", name="Blitzkrieg Bop", artist="Ramones", bpm=165, energy=0.96,
              duration_ms=133000, spotify_url="https://open.spotify.com/track/blitzkrieg"),
        Track(id="28", name="Rock and Roll All Nite", artist="Kiss", bpm=168, energy=0.95,
              duration_ms=169000, spotify_url="https://open.spotify.com/track/rock_roll"),
        Track(id="29", name="Basket Case", artist="Green Day", bpm=167, energy=0.93,
              duration_ms=183000, spotify_url="https://open.spotify.com/track/basket_case"),
        Track(id="30", name="Ace of Spades", artist="Motörhead", bpm=170, energy=0.98,
              duration_ms=169000, spotify_url="https://open.spotify.com/track/ace_spades"),
        Track(id="31", name="Search and Destroy", artist="Iggy & The Stooges", bpm=172, energy=0.97,
              duration_ms=212000, spotify_url="https://open.spotify.com/track/search_destroy"),
        Track(id="32", name="I Wanna Be Sedated", artist="Ramones", bpm=174, energy=0.96,
              duration_ms=150000, spotify_url="https://open.spotify.com/track/sedated"),
        
        # Cooldown tracks (80-100 BPM)
        Track(id="33", name="Where Is My Mind?", artist="Pixies", bpm=85, energy=0.42,
              duration_ms=232000, spotify_url="https://open.spotify.com/track/where_mind"),
        Track(id="34", name="Creep", artist="Radiohead", bpm=92, energy=0.44,
              duration_ms=238000, spotify_url="https://open.spotify.com/track/creep"),
        Track(id="35", name="Hurt", artist="Johnny Cash", bpm=88, energy=0.38,
              duration_ms=217000, spotify_url="https://open.spotify.com/track/hurt"),
        Track(id="36", name="Under the Bridge", artist="Red Hot Chili Peppers", bpm=90, energy=0.40,
              duration_ms=264000, spotify_url="https://open.spotify.com/track/under_bridge"),
        Track(id="37", name="The Man Who Sold the World", artist="Nirvana", bpm=95, energy=0.43,
              duration_ms=261000, spotify_url="https://open.spotify.com/track/sold_world"),
              
        # Additional variety tracks
        Track(id="38", name="Alive", artist="Pearl Jam", bpm=145, energy=0.84,
              duration_ms=341000, spotify_url="https://open.spotify.com/track/alive"),
        Track(id="39", name="My Hero", artist="Foo Fighters", bpm=140, energy=0.81,
              duration_ms=260000, spotify_url="https://open.spotify.com/track/my_hero"),
        Track(id="40", name="Even Flow", artist="Pearl Jam", bpm=142, energy=0.82,
              duration_ms=294000, spotify_url="https://open.spotify.com/track/even_flow"),
        Track(id="41", name="Break Stuff", artist="Limp Bizkit", bpm=155, energy=0.92,
              duration_ms=166000, spotify_url="https://open.spotify.com/track/break_stuff"),
        Track(id="42", name="Walk", artist="Pantera", bpm=120, energy=0.88,
              duration_ms=317000, spotify_url="https://open.spotify.com/track/walk"),
        Track(id="43", name="Chop Suey!", artist="System Of A Down", bpm=128, energy=0.91,
              duration_ms=210000, spotify_url="https://open.spotify.com/track/chop_suey"),
        Track(id="44", name="One", artist="Metallica", bpm=120, energy=0.79,
              duration_ms=446000, spotify_url="https://open.spotify.com/track/one"),
        Track(id="45", name="Black", artist="Pearl Jam", bpm=105, energy=0.51,
              duration_ms=342000, spotify_url="https://open.spotify.com/track/black"),
        Track(id="46", name="Today", artist="The Smashing Pumpkins", bpm=136, energy=0.76,
              duration_ms=213000, spotify_url="https://open.spotify.com/track/today"),
        Track(id="47", name="No Rain", artist="Blind Melon", bpm=118, energy=0.60,
              duration_ms=217000, spotify_url="https://open.spotify.com/track/no_rain"),
        Track(id="48", name="Buddy Holly", artist="Weezer", bpm=131, energy=0.78,
              duration_ms=159000, spotify_url="https://open.spotify.com/track/buddy_holly"),
        Track(id="49", name="1979", artist="The Smashing Pumpkins", bpm=132, energy=0.64,
              duration_ms=260000, spotify_url="https://open.spotify.com/track/1979"),
        Track(id="50", name="Sex Type Thing", artist="Stone Temple Pilots", bpm=148, energy=0.86,
              duration_ms=222000, spotify_url="https://open.spotify.com/track/sex_type"),
    ]
    
    def __init__(self, client_id: Optional[str] = None, client_secret: Optional[str] = None):
        """Initialize mock client (credentials not required)"""
        self.client_id = client_id
        self.client_secret = client_secret
    
    def search_tracks(self, 
                     bpm_min: int, 
                     bpm_max: int, 
                     min_energy: float = 0.0,
                     max_energy: float = 1.0,
                     limit: int = 20) -> list[Track]:
        """Search for tracks matching BPM and energy criteria"""
        # Filter tracks by BPM range and energy
        matching_tracks = [
            track for track in self.TRACK_DATABASE
            if bpm_min <= track.bpm <= bpm_max
            and min_energy <= track.energy <= max_energy
        ]
        
        # Sort by how well they match the middle of the BPM range
        target_bpm = (bpm_min + bpm_max) / 2
        matching_tracks.sort(key=lambda t: abs(t.bpm - target_bpm))
        
        return matching_tracks[:limit]
    
    def get_track(self, track_id: str) -> Optional[Track]:
        """Get a specific track by ID"""
        for track in self.TRACK_DATABASE:
            if track.id == track_id:
                return track
        return None

