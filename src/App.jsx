import { useEffect, useMemo, useState } from 'react';
import { divIcon } from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';

const USA_CENTER = [39.5, -98.35];
const DEFAULT_ZOOM = 4;
const MAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const MAP_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

const eventPinIcon = divIcon({
  className: 'event-pin',
  html: '<span></span>',
  iconAnchor: [15, 36],
  iconSize: [30, 36],
  popupAnchor: [0, -34],
});

function getStoredUser() {
  try {
    const cookie = document.cookie
      .split('; ')
      .find((item) => item.startsWith('eventAtlasUser='));

    if (!cookie) {
      return null;
    }

    return JSON.parse(decodeURIComponent(cookie.split('=')[1])) || null;
  } catch {
    return null;
  }
}

function setUserCookie(user) {
  const cookieUser = {
    id: user.id,
    name: user.name,
    gmail: user.gmail,
    college_id: user.college_id,
    college_name: user.college_name,
    college_city: user.college_city,
    college_state: user.college_state,
    college_country: user.college_country,
    college_latitude: user.college_latitude,
    college_longitude: user.college_longitude,
    college_event_calendar_url: user.college_event_calendar_url,
  };
  const encodedUser = encodeURIComponent(JSON.stringify(cookieUser));
  document.cookie = `eventAtlasUser=${encodedUser}; Max-Age=604800; Path=/; SameSite=Lax`;
}

function clearUserCookie() {
  document.cookie = 'eventAtlasUser=; Max-Age=0; Path=/; SameSite=Lax';
}

async function readApiJson(response, fallbackMessage) {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    throw new Error(fallbackMessage);
  }

  return response.json();
}

function MapFocus({ college, events, selectedEvent }) {
  const map = useMap();

  useEffect(() => {
    const resizeMap = () => {
      window.requestAnimationFrame(() => {
        map.invalidateSize({ debounceMoveend: true });
      });
    };
    const container = map.getContainer();
    const observer = new ResizeObserver(resizeMap);

    observer.observe(container);
    resizeMap();

    const firstTimer = window.setTimeout(resizeMap, 120);
    const secondTimer = window.setTimeout(resizeMap, 400);

    return () => {
      observer.disconnect();
      window.clearTimeout(firstTimer);
      window.clearTimeout(secondTimer);
    };
  }, [map]);

  useEffect(() => {
    if (selectedEvent) {
      map.invalidateSize({ debounceMoveend: true });
      map.flyTo([selectedEvent.latitude, selectedEvent.longitude], 16, { duration: 0.55 });
      return;
    }

    if (events.length > 1) {
      const bounds = events.map((event) => [event.latitude, event.longitude]);
      map.invalidateSize({ debounceMoveend: true });
      map.fitBounds(bounds, { animate: true, maxZoom: 15, padding: [72, 72] });
      return;
    }

    if (events.length === 1) {
      map.invalidateSize({ debounceMoveend: true });
      map.flyTo([events[0].latitude, events[0].longitude], 15, { duration: 0.55 });
      return;
    }

    if (college) {
      map.invalidateSize({ debounceMoveend: true });
      map.flyTo([college.latitude, college.longitude], 12, { duration: 0.55 });
      return;
    }

    map.invalidateSize({ debounceMoveend: true });
    map.flyTo(USA_CENTER, DEFAULT_ZOOM, { duration: 0.55 });
  }, [college, events, map, selectedEvent]);

  return null;
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('eventAtlasTheme') || 'light');
  const [page, setPage] = useState('home');
  const [currentUser, setCurrentUser] = useState(getStoredUser);
  const [authMessage, setAuthMessage] = useState('Use your UniSphere account to keep campus discovery personal.');
  const [loginForm, setLoginForm] = useState({ name: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', gmail: '', password: '', college_id: '' });
  const [friendName, setFriendName] = useState('');
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [requestPopupMinimized, setRequestPopupMinimized] = useState(false);
  const [friendMessage, setFriendMessage] = useState('Add friends by their username.');
  const [accountEvents, setAccountEvents] = useState([]);
  const [viewedProfile, setViewedProfile] = useState(null);
  const [viewedProfileFriends, setViewedProfileFriends] = useState([]);
  const [viewedProfileEvents, setViewedProfileEvents] = useState([]);
  const [collegeOptions, setCollegeOptions] = useState([]);
  const [homeCollegeLoadedFor, setHomeCollegeLoadedFor] = useState(null);
  const [query, setQuery] = useState('');
  const [colleges, setColleges] = useState([]);
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [status, setStatus] = useState('Search for a college to load events.');
  const [loading, setLoading] = useState(false);

  const selectedCollegeName = selectedCollege?.name ?? 'UniSphere';
  const currentUserCollege = currentUser?.college_id
    ? {
        id: currentUser.college_id,
        name: currentUser.college_name,
        city: currentUser.college_city,
        state: currentUser.college_state,
        country: currentUser.college_country,
        latitude: currentUser.college_latitude,
        longitude: currentUser.college_longitude,
        event_calendar_url: currentUser.college_event_calendar_url,
      }
    : null;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('eventAtlasTheme', theme);
  }, [theme]);

  useEffect(() => {
    async function loadCollegeOptions() {
      try {
        const response = await fetch(apiUrl('/api/college-options'));
        const data = await response.json();
        setCollegeOptions(data.colleges || []);
      } catch {
        setCollegeOptions([]);
      }
    }

    loadCollegeOptions();
  }, []);

  useEffect(() => {
    async function loadCurrentUser() {
      if (!currentUser?.id) {
        setFriends([]);
        setFriendRequests([]);
        return;
      }

      try {
        const response = await fetch(apiUrl(`/api/users/${currentUser.id}`));
        const data = await response.json();

        if (response.ok) {
          setCurrentUser(data.user);
          setUserCookie(data.user);
        } else if (response.status === 404) {
          clearUserCookie();
          setCurrentUser(null);
          setPage('home');
        }
      } catch {
        // Keep the cookie user if the profile refresh fails.
      }
    }

    loadCurrentUser();
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser?.id) {
      setFriends([]);
      setFriendRequests([]);
      setAccountEvents([]);
      return;
    }

    loadFriends();
    loadFriendRequests();
    loadAccountEvents();
  }, [currentUser?.id]);

  useEffect(() => {
    if (!friendRequests.length) {
      setRequestPopupMinimized(false);
    }
  }, [friendRequests.length]);

  useEffect(() => {
    if (
      page === 'home' &&
      currentUserCollege?.id &&
      homeCollegeLoadedFor !== currentUserCollege.id
    ) {
      setHomeCollegeLoadedFor(currentUserCollege.id);
      loadCollegeEvents(currentUserCollege);
    }
  }, [currentUserCollege?.id, homeCollegeLoadedFor, page]);

  function toggleTheme() {
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'));
  }

  async function searchColleges(event) {
    event.preventDefault();

    if (!query.trim()) {
      setStatus('Enter a college name first.');
      return;
    }

    setLoading(true);
    setSelectedCollege(null);
    setSelectedEvent(null);
    setEvents([]);

    try {
      const response = await fetch(apiUrl(`/api/colleges?query=${encodeURIComponent(query)}`));
      const data = await response.json();
      setColleges(data.colleges);
      setStatus(
        data.colleges.length
          ? `Found ${data.colleges.length} matching college${data.colleges.length === 1 ? '' : 's'}.`
          : 'No matching colleges found yet.',
      );
    } catch {
      setStatus('Backend not reachable.');
    } finally {
      setLoading(false);
    }
  }

  async function loadCollegeEvents(college) {
    setSelectedCollege(college);
    setSelectedEvent(null);
    setLoading(true);

    try {
      const userQuery = currentUser?.id ? `?user_id=${currentUser.id}` : '';
      const response = await fetch(apiUrl(`/api/colleges/${college.id}/events${userQuery}`));
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not load events for this college.');
      }

      setEvents(data.events);
      setColleges([]);
      setStatus(`${college.name}: ${data.events.length} real events loaded from the official calendar.`);
    } catch {
      setStatus('Could not load events for this college.');
    } finally {
      setLoading(false);
    }
  }

  async function loadEventDetails(eventId) {
    setLoading(true);

    try {
      const userQuery = currentUser?.id ? `?user_id=${currentUser.id}` : '';
      const response = await fetch(apiUrl(`/api/events/${eventId}${userQuery}`));
      const data = await response.json();
      setSelectedEvent(data.event);
      setStatus(`Loaded details for ${data.event.title}.`);
    } catch {
      setStatus('Could not load event details.');
    } finally {
      setLoading(false);
    }
  }

  async function toggleEventJoin() {
    if (!currentUser) {
      setStatus('Login before joining events.');
      return;
    }

    if (!selectedEvent) {
      return;
    }

    const nextJoined = !selectedEvent.joined;
    setLoading(true);

    try {
      const response = await fetch(apiUrl(`/api/events/${selectedEvent.id}/join`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, joined: nextJoined }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not update event.');
      }

      setSelectedEvent(data.event);
      setEvents((currentEvents) =>
        currentEvents.map((event) =>
          event.id === data.event.id ? { ...event, joined: data.event.joined } : event,
        ),
      );
      loadAccountEvents();
      setStatus(nextJoined ? 'Joined event.' : 'Left event.');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  const visibleEvents = useMemo(
    () => events.filter((event) => event.latitude && event.longitude),
    [events],
  );
  const authPageTitle =
    page === 'login'
      ? 'Login'
      : page === 'signup'
        ? 'Create Account'
        : page === 'profile'
          ? viewedProfile?.name || 'Profile'
          : 'Account';
  const incomingFriendRequest = friendRequests[0];

  function navigate(nextPage) {
    setPage(nextPage);
    setAuthMessage('Use your UniSphere account to keep campus discovery personal.');
    if (nextPage !== 'profile') {
      setViewedProfile(null);
      setViewedProfileFriends([]);
      setViewedProfileEvents([]);
    }
  }

  function saveUser(user) {
    setCurrentUser(user);
    setUserCookie(user);
  }

  function logout() {
    setCurrentUser(null);
    clearUserCookie();
    setFriends([]);
    setFriendRequests([]);
    setAccountEvents([]);
    setRequestPopupMinimized(false);
    setViewedProfile(null);
    setViewedProfileFriends([]);
    setViewedProfileEvents([]);
    setFriendName('');
    setFriendMessage('Add friends by their username.');
    setHomeCollegeLoadedFor(null);
    setStatus('Signed out.');
  }

  async function loadFriends() {
    if (!currentUser?.id) {
      return;
    }

    try {
      const response = await fetch(apiUrl(`/api/users/${currentUser.id}/friends`));
      const data = await readApiJson(response, 'Friends API returned a page instead of data. Restart the backend and Vite dev server.');

      if (!response.ok) {
        throw new Error(data.error || 'Could not load friends.');
      }

      setFriends(data.friends || []);
    } catch (error) {
      setFriendMessage(error.message);
    }
  }

  async function loadFriendRequests() {
    if (!currentUser?.id) {
      return;
    }

    try {
      const response = await fetch(apiUrl(`/api/users/${currentUser.id}/friend-requests`));
      const data = await readApiJson(response, 'Friend requests API returned a page instead of data. Restart the backend and Vite dev server.');

      if (!response.ok) {
        throw new Error(data.error || 'Could not load friend requests.');
      }

      setFriendRequests(data.requests || []);
    } catch (error) {
      setFriendMessage(error.message);
    }
  }

  async function loadAccountEvents() {
    if (!currentUser?.id) {
      return;
    }

    try {
      const response = await fetch(apiUrl(`/api/users/${currentUser.id}/profile`));
      const data = await readApiJson(response, 'Profile API returned a page instead of data. Restart the backend and Vite dev server.');

      if (!response.ok) {
        throw new Error(data.error || 'Could not load joined events.');
      }

      setAccountEvents(data.joined_events || []);
    } catch (error) {
      setFriendMessage(error.message);
    }
  }

  async function addFriend(event) {
    event.preventDefault();

    if (!currentUser) {
      setFriendMessage('Login before adding friends.');
      return;
    }

    if (!friendName.trim()) {
      setFriendMessage("Enter your friend's username.");
      return;
    }

    setLoading(true);
    setFriendMessage('Sending friend request...');

    try {
      const response = await fetch(apiUrl(`/api/users/${currentUser.id}/friends`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: friendName }),
      });
      const data = await readApiJson(response, 'Friends API returned a page instead of data. Restart the backend and Vite dev server.');

      if (!response.ok) {
        throw new Error(data.error || 'Could not send friend request.');
      }

      setFriendName('');
      setFriendMessage(`Friend request sent to ${data.request.receiver_name}.`);
    } catch (error) {
      setFriendMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function openProfile(userId) {
    if (!userId) {
      return;
    }

    if (currentUser?.id === userId) {
      navigate('account');
      return;
    }

    setLoading(true);
    setAuthMessage('Loading profile...');

    try {
      const response = await fetch(apiUrl(`/api/users/${userId}/profile`));
      const data = await readApiJson(response, 'Profile API returned a page instead of data. Restart the backend and Vite dev server.');

      if (!response.ok) {
        throw new Error(data.error || 'Could not load profile.');
      }

      setViewedProfile(data.profile);
      setViewedProfileFriends(data.friends || []);
      setViewedProfileEvents(data.joined_events || []);
      setPage('profile');
      setAuthMessage(`Viewing ${data.profile.name}.`);
    } catch (error) {
      setAuthMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function sendProfileFriendRequest() {
    if (!currentUser) {
      setAuthMessage('Login before sending friend requests.');
      return;
    }

    if (!viewedProfile) {
      return;
    }

    setLoading(true);
    setAuthMessage('Sending friend request...');

    try {
      const response = await fetch(apiUrl(`/api/users/${currentUser.id}/friends`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friend_id: viewedProfile.id }),
      });
      const data = await readApiJson(response, 'Friends API returned a page instead of data. Restart the backend and Vite dev server.');

      if (!response.ok) {
        throw new Error(data.error || 'Could not send friend request.');
      }

      setAuthMessage(`Friend request sent to ${data.request.receiver_name}.`);
    } catch (error) {
      setAuthMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function openJoinedEvent(eventId) {
    setLoading(true);

    try {
      const userQuery = currentUser?.id ? `?user_id=${currentUser.id}` : '';
      const response = await fetch(apiUrl(`/api/events/${eventId}${userQuery}`));
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not load event.');
      }

      setSelectedCollege({
        id: data.event.college_id,
        name: data.event.college_name,
        latitude: data.event.latitude,
        longitude: data.event.longitude,
      });
      setEvents([data.event]);
      setSelectedEvent(data.event);
      setPage('home');
      setStatus(`Loaded details for ${data.event.title}.`);
    } catch (error) {
      setAuthMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function respondToFriendRequest(requestId, action) {
    if (!currentUser) {
      return;
    }

    setLoading(true);
    setFriendMessage(action === 'accept' ? 'Accepting request...' : 'Declining request...');

    try {
      const response = await fetch(apiUrl(`/api/users/${currentUser.id}/friend-requests/${requestId}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await readApiJson(response, 'Friend requests API returned a page instead of data. Restart the backend and Vite dev server.');

      if (!response.ok) {
        throw new Error(data.error || 'Could not update friend request.');
      }

      setFriends(data.friends || []);
      setFriendRequests(data.requests || []);
      setRequestPopupMinimized(false);
      setFriendMessage(action === 'accept' ? 'Friend request accepted.' : 'Friend request declined.');
    } catch (error) {
      setFriendMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfileImage(event) {
    const file = event.target.files?.[0];

    if (!file || !currentUser) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setAuthMessage('Choose an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      setLoading(true);
      setAuthMessage('Updating profile image...');

      try {
        const response = await fetch(apiUrl(`/api/users/${currentUser.id}/profile-image`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profile_image: reader.result }),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Could not update profile image.');
        }

        saveUser(data.user);
        setAuthMessage('Profile image updated.');
      } catch (error) {
        setAuthMessage(error.message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  async function submitLogin(event) {
    event.preventDefault();
    setLoading(true);
    setAuthMessage('Checking your login...');

    try {
      const response = await fetch(apiUrl('/api/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed.');
      }

      saveUser(data.user);
      setLoginForm({ name: '', password: '' });
      setStatus(`Welcome back, ${data.user.name}.`);
      setPage('home');
    } catch (error) {
      setAuthMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitSignup(event) {
    event.preventDefault();
    setLoading(true);
    setAuthMessage('Creating your account...');

    try {
      const response = await fetch(apiUrl('/api/signup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupForm),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Signup failed.');
      }

      saveUser(data.user);
      setSignupForm({ name: '', gmail: '', password: '', college_id: '' });
      setStatus(`Account created for ${data.user.name}.`);
      setPage('home');
    } catch (error) {
      setAuthMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={`app-shell ${page !== 'home' ? 'auth-shell' : ''}`}>
      {page === 'home' ? (
        <header className="top-bar">
          <div className="top-copy">
            <p className="eyebrow">UniSphere</p>
            <h1>{selectedCollegeName}</h1>
            <p className="status compact-status">{loading ? 'Loading...' : status}</p>
          </div>
          <div className="top-actions">
            {currentUser ? (
              <>
                <span className="user-chip" title={currentUser.college_name || currentUser.name}>
                  {currentUser.name}
                </span>
                <button className="nav-button" type="button" onClick={() => navigate('account')}>
                  Account
                </button>
                <button className="nav-button" type="button" onClick={logout}>
                  Sign out
                </button>
              </>
            ) : (
              <div className="auth-actions">
                <button className="nav-button" type="button" onClick={() => navigate('login')}>
                  Login
                </button>
                <button className="nav-button primary-nav" type="button" onClick={() => navigate('signup')}>
                  Signup
                </button>
              </div>
            )}
            <button
              aria-pressed={theme === 'dark'}
              className="theme-toggle"
              type="button"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
          </div>
        </header>
      ) : (
        <header className="auth-top-bar">
          <div>
            <p className="eyebrow">UniSphere</p>
            <h1>{authPageTitle}</h1>
          </div>
          <div className="top-actions">
            <p className="status">{loading ? 'Loading...' : authMessage}</p>
            <button className="nav-button" type="button" onClick={() => navigate('home')}>
              Back home
            </button>
            <button
              aria-pressed={theme === 'dark'}
              className="theme-toggle"
              type="button"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
          </div>
        </header>
      )}

      {currentUser && incomingFriendRequest && (
        <aside
          className={`request-popup ${requestPopupMinimized ? 'minimized' : ''}`}
          role="dialog"
          aria-label="Friend request"
        >
          {requestPopupMinimized ? (
            <button
              className="request-mini-button"
              type="button"
              onClick={() => setRequestPopupMinimized(false)}
            >
              {friendRequests.length} friend request{friendRequests.length === 1 ? '' : 's'}
            </button>
          ) : (
            <>
              <div className="request-topline">
                <p className="eyebrow">Friend request</p>
                <button
                  className="request-minimize"
                  type="button"
                  aria-label="Minimize friend request popup"
                  onClick={() => setRequestPopupMinimized(true)}
                >
                  Minimize
                </button>
              </div>
              <div className="request-profile">
                {incomingFriendRequest.requester_profile_image ? (
                  <img
                    alt={`${incomingFriendRequest.requester_name} profile`}
                    className="friend-avatar"
                    src={incomingFriendRequest.requester_profile_image}
                  />
                ) : (
                  <div className="friend-avatar friend-placeholder" aria-label="Blank requester profile image">
                    {incomingFriendRequest.requester_name.slice(0, 1)}
                  </div>
                )}
                <div>
                  <strong>{incomingFriendRequest.requester_name}</strong>
                  <small>
                    {incomingFriendRequest.requester_college_name
                      ? `${incomingFriendRequest.requester_college_name}, ${incomingFriendRequest.requester_college_state}`
                      : 'No college selected'}
                  </small>
                </div>
              </div>
              {friendRequests.length > 1 && (
                <p className="request-count">1 of {friendRequests.length} pending</p>
              )}
              <div className="request-actions">
                <button
                  type="button"
                  onClick={() => respondToFriendRequest(incomingFriendRequest.id, 'accept')}
                >
                  Accept
                </button>
                <button
                  className="secondary-action"
                  type="button"
                  onClick={() => respondToFriendRequest(incomingFriendRequest.id, 'decline')}
                >
                  Decline
                </button>
              </div>
            </>
          )}
        </aside>
      )}

      {page === 'login' && (
        <section className="auth-page" aria-label="Login page">
          <form className="auth-card" onSubmit={submitLogin}>
            <div className="auth-card-header">
              <p className="eyebrow">Welcome back</p>
              <h2>Login to your event account</h2>
            </div>
            <label htmlFor="login-name">Name</label>
            <input
              id="login-name"
              value={loginForm.name}
              onChange={(event) => setLoginForm({ ...loginForm, name: event.target.value })}
              placeholder="Your name"
            />
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={loginForm.password}
              onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
              placeholder="Your password"
            />
            <button type="submit">Login</button>
            <button className="secondary-action" type="button" onClick={() => navigate('signup')}>
              Create an account
            </button>
          </form>
        </section>
      )}

      {page === 'signup' && (
        <section className="auth-page" aria-label="Signup page">
          <form className="auth-card" onSubmit={submitSignup}>
            <div className="auth-card-header">
              <p className="eyebrow">New account</p>
              <h2>Signup with your Gmail</h2>
            </div>
            <label htmlFor="signup-name">Name</label>
            <input
              id="signup-name"
              value={signupForm.name}
              onChange={(event) => setSignupForm({ ...signupForm, name: event.target.value })}
              placeholder="Your name"
            />
            <label htmlFor="signup-gmail">Gmail</label>
            <input
              id="signup-gmail"
              type="email"
              value={signupForm.gmail}
              onChange={(event) => setSignupForm({ ...signupForm, gmail: event.target.value })}
              placeholder="you@gmail.com"
            />
            <label htmlFor="signup-college">College</label>
            <select
              id="signup-college"
              value={signupForm.college_id}
              onChange={(event) => setSignupForm({ ...signupForm, college_id: event.target.value })}
            >
              <option value="">Choose your college</option>
              {collegeOptions.map((college) => (
                <option key={college.id} value={college.id}>
                  {college.name} - {college.city}, {college.state}
                </option>
              ))}
            </select>
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              value={signupForm.password}
              onChange={(event) => setSignupForm({ ...signupForm, password: event.target.value })}
              placeholder="At least 8 characters"
            />
            <button type="submit">Signup</button>
            <button className="secondary-action" type="button" onClick={() => navigate('login')}>
              Already have an account
            </button>
          </form>
        </section>
      )}

      {page === 'account' && (
        <section className="auth-page" aria-label="Account page">
          <article className="auth-card account-card">
            <div className="auth-card-header">
              <p className="eyebrow">Profile</p>
              <h2>{currentUser?.name || 'Account'}</h2>
            </div>
            <div className="profile-image-wrap">
              {currentUser?.profile_image ? (
                <img
                  alt={`${currentUser.name} profile`}
                  className="profile-image"
                  src={currentUser.profile_image}
                />
              ) : (
                <div className="profile-image profile-placeholder" aria-label="Blank profile image">
                  {currentUser?.name?.slice(0, 1) || '?'}
                </div>
              )}
              <label className="upload-button" htmlFor="profile-image-input">
                Change image
              </label>
              <input
                accept="image/*"
                className="visually-hidden"
                id="profile-image-input"
                type="file"
                onChange={updateProfileImage}
              />
            </div>
            <dl className="account-details">
              <div>
                <dt>Name</dt>
                <dd>{currentUser?.name}</dd>
              </div>
              <div>
                <dt>College</dt>
                <dd>{currentUser?.college_name || 'No college selected'}</dd>
              </div>
            </dl>
            <section className="friends-panel" aria-label="Friends">
              <div className="requests-panel" aria-label="Pending friend requests">
                <div className="section-heading">
                  <h2>Friend requests</h2>
                  <span>{friendRequests.length}</span>
                </div>
                <div className="request-list">
                  {friendRequests.map((request) => (
                    <article className="request-card" key={request.id}>
                      <div className="request-profile">
                        {request.requester_profile_image ? (
                          <img
                            alt={`${request.requester_name} profile`}
                            className="friend-avatar"
                            src={request.requester_profile_image}
                          />
                        ) : (
                          <div className="friend-avatar friend-placeholder" aria-label="Blank requester profile image">
                            {request.requester_name.slice(0, 1)}
                          </div>
                        )}
                        <div>
                          <strong>{request.requester_name}</strong>
                          <small>
                            {request.requester_college_name
                              ? `${request.requester_college_name}, ${request.requester_college_state}`
                              : 'No college selected'}
                          </small>
                        </div>
                      </div>
                      <div className="request-actions">
                        <button
                          type="button"
                          onClick={() => respondToFriendRequest(request.id, 'accept')}
                        >
                          Accept
                        </button>
                        <button
                          className="secondary-action"
                          type="button"
                          onClick={() => respondToFriendRequest(request.id, 'decline')}
                        >
                          Decline
                        </button>
                      </div>
                    </article>
                  ))}
                  {!friendRequests.length && (
                    <p className="empty-state">Incoming friend requests will show up here.</p>
                  )}
                </div>
              </div>

              <div className="section-heading">
                <h2>Joined events</h2>
                <span>{accountEvents.length}</span>
              </div>
              <div className="profile-event-list">
                {accountEvents.map((event) => (
                  <button
                    className="profile-event-row"
                    key={event.id}
                    type="button"
                    onClick={() => openJoinedEvent(event.id)}
                  >
                    <span>{event.title}</span>
                    <small>
                      {event.college_name} - {event.location_name}
                    </small>
                  </button>
                ))}
                {!accountEvents.length && (
                  <p className="empty-state">Joined events will show up here.</p>
                )}
              </div>

              <div className="section-heading">
                <h2>Friends</h2>
                <span>{friends.length}</span>
              </div>
              <form className="friend-form" onSubmit={addFriend}>
                <label htmlFor="friend-name">Friend username</label>
                <div className="friend-row">
                  <input
                    id="friend-name"
                    value={friendName}
                    onChange={(event) => setFriendName(event.target.value)}
                    placeholder="Type their username"
                  />
                  <button type="submit">Send</button>
                </div>
              </form>
              <p className="friend-message">{loading ? 'Working...' : friendMessage}</p>
              <div className="friend-list">
                {friends.map((friend) => (
                  <button
                    className="friend-card friend-link"
                    key={friend.id}
                    type="button"
                    onClick={() => openProfile(friend.id)}
                  >
                    {friend.profile_image ? (
                      <img
                        alt={`${friend.name} profile`}
                        className="friend-avatar"
                        src={friend.profile_image}
                      />
                    ) : (
                      <div className="friend-avatar friend-placeholder" aria-label="Blank friend profile image">
                        {friend.name.slice(0, 1)}
                      </div>
                    )}
                    <div>
                      <strong>{friend.name}</strong>
                      <small>
                        {friend.college_name
                          ? `${friend.college_name}, ${friend.college_state}`
                          : 'No college selected'}
                      </small>
                    </div>
                  </button>
                ))}
                {!friends.length && (
                  <p className="empty-state">Accepted friends will show up here.</p>
                )}
              </div>
            </section>
          </article>
        </section>
      )}

      {page === 'profile' && viewedProfile && (
        <section className="auth-page" aria-label={`${viewedProfile.name} profile page`}>
          <article className="auth-card account-card">
            <div className="auth-card-header">
              <p className="eyebrow">UniSphere profile</p>
              <h2>{viewedProfile.name}</h2>
            </div>
            <div className="profile-image-wrap">
              {viewedProfile.profile_image ? (
                <img
                  alt={`${viewedProfile.name} profile`}
                  className="profile-image"
                  src={viewedProfile.profile_image}
                />
              ) : (
                <div className="profile-image profile-placeholder" aria-label="Blank profile image">
                  {viewedProfile.name.slice(0, 1)}
                </div>
              )}
              {currentUser?.id !== viewedProfile.id && (
                <button type="button" onClick={sendProfileFriendRequest}>
                  Send friend request
                </button>
              )}
            </div>
            <dl className="account-details">
              <div>
                <dt>Name</dt>
                <dd>{viewedProfile.name}</dd>
              </div>
              <div>
                <dt>College</dt>
                <dd>{viewedProfile.college_name || 'No college selected'}</dd>
              </div>
            </dl>
            <section className="friends-panel" aria-label={`${viewedProfile.name} friends`}>
              <div className="section-heading">
                <h2>Joined events</h2>
                <span>{viewedProfileEvents.length}</span>
              </div>
              <div className="profile-event-list">
                {viewedProfileEvents.map((event) => (
                  <button
                    className="profile-event-row"
                    key={event.id}
                    type="button"
                    onClick={() => openJoinedEvent(event.id)}
                  >
                    <span>{event.title}</span>
                    <small>
                      {event.college_name} · {event.location_name}
                    </small>
                  </button>
                ))}
                {!viewedProfileEvents.length && (
                  <p className="empty-state">No joined events to show yet.</p>
                )}
              </div>

              <div className="section-heading">
                <h2>Friends</h2>
                <span>{viewedProfileFriends.length}</span>
              </div>
              <div className="friend-list">
                {viewedProfileFriends.map((friend) => (
                  <button
                    className="friend-card friend-link"
                    key={friend.id}
                    type="button"
                    onClick={() => openProfile(friend.id)}
                  >
                    {friend.profile_image ? (
                      <img
                        alt={`${friend.name} profile`}
                        className="friend-avatar"
                        src={friend.profile_image}
                      />
                    ) : (
                      <div className="friend-avatar friend-placeholder" aria-label="Blank friend profile image">
                        {friend.name.slice(0, 1)}
                      </div>
                    )}
                    <div>
                      <strong>{friend.name}</strong>
                      <small>
                        {friend.college_name
                          ? `${friend.college_name}, ${friend.college_state}`
                          : 'No college selected'}
                      </small>
                    </div>
                  </button>
                ))}
                {!viewedProfileFriends.length && (
                  <p className="empty-state">No friends to show yet.</p>
                )}
              </div>
            </section>
          </article>
        </section>
      )}

      {page === 'home' && (
      <section className="workspace">
        <aside className="sidebar" aria-label="College search and event details">
          <section className="details-panel" aria-label="Selected event details">
            {selectedEvent ? (
              <article className="event-detail">
                <div className="detail-header">
                  <div className="detail-title">
                    <p className="eyebrow">Selected event</p>
                    <h3>{selectedEvent.title}</h3>
                  </div>
                  <button
                    className={selectedEvent.joined ? 'join-button joined' : 'join-button'}
                    type="button"
                    onClick={toggleEventJoin}
                  >
                    {selectedEvent.joined ? 'Unjoin' : 'Join'}
                  </button>
                </div>
                <p>{selectedEvent.description}</p>
                <dl>
                  <div>
                    <dt>College</dt>
                    <dd>{selectedEvent.college_name}</dd>
                  </div>
                  <div>
                    <dt>When</dt>
                    <dd>{selectedEvent.start_time}</dd>
                  </div>
                  <div>
                    <dt>Where</dt>
                    <dd>{selectedEvent.location_name}</dd>
                  </div>
                  <div>
                    <dt>Joined</dt>
                    <dd>{selectedEvent.attendee_count || 0}</dd>
                  </div>
                </dl>
                <a href={selectedEvent.source_url} target="_blank" rel="noreferrer">
                  Source calendar
                </a>
              </article>
            ) : (
              <article className="event-detail empty-detail">
                <div className="detail-title">
                  <p className="eyebrow">Event details</p>
                  <h3>{selectedCollege ? 'Choose an event marker' : 'Start with a college'}</h3>
                </div>
                <p>
                  {selectedCollege
                    ? 'The map has zoomed to this campus. Click a pin to ask Flask for full event details.'
                    : 'Search for a university below. The map begins on the USA and will autozoom to campus events.'}
                </p>
              </article>
            )}
          </section>

          <section className="events-panel" aria-label="Loaded events">
            <div className="section-heading">
              <h2>Upcoming events</h2>
              <span>{events.length}</span>
            </div>
            <div className="event-list">
              {events.map((event) => (
                <button
                  className={`event-row ${selectedEvent?.id === event.id ? 'active' : ''}`}
                  key={event.id}
                  type="button"
                  onClick={() => loadEventDetails(event.id)}
                >
                  <span className="event-row-title">
                    <span>{event.title}</span>
                    {event.joined && <strong>Joined</strong>}
                  </span>
                  <small>{event.location_name}</small>
                  {event.friends_joined?.length > 0 && (
                    <small className="friends-joined-line">
                      <span aria-hidden="true">👥</span>
                      Friends joined: {event.friends_joined.join(', ')}
                    </small>
                  )}
                </button>
              ))}
              {!events.length && (
                <p className="empty-state">Search a college to load official campus events.</p>
              )}
            </div>
          </section>

          <section className="search-dock" aria-label="College search">
            <form className="search-form" onSubmit={searchColleges}>
              <label htmlFor="college-search">Find a college</label>
              <div className="search-row">
                <input
                  id="college-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Try Stanford, MIT, Cornell, Yale"
                />
                <button type="submit">Search</button>
              </div>
            </form>

            {colleges.length > 0 && (
              <div className="result-list">
                {colleges.map((college) => (
                  <button
                    className={`result-button ${selectedCollege?.id === college.id ? 'active' : ''}`}
                    key={college.id}
                    type="button"
                    onClick={() => loadCollegeEvents(college)}
                  >
                    <span>{college.name}</span>
                    <small>
                      {college.city}, {college.state}
                    </small>
                  </button>
                ))}
              </div>
            )}
          </section>
        </aside>

        <div className="map-panel" aria-label="Map of college events">
          <MapContainer center={USA_CENTER} zoom={DEFAULT_ZOOM} minZoom={3} scrollWheelZoom>
            <MapFocus college={selectedCollege} events={visibleEvents} selectedEvent={selectedEvent} />
            <TileLayer
              attribution={MAP_ATTRIBUTION}
              url={MAP_TILE_URL}
            />
            {visibleEvents.map((event) => (
              <Marker
                eventHandlers={{
                  click: () => loadEventDetails(event.id),
                }}
                icon={eventPinIcon}
                key={event.id}
                position={[event.latitude, event.longitude]}
              >
                <Popup>
                  <strong>{event.title}</strong>
                  <br />
                  {event.location_name}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </section>
      )}
    </main>
  );
}

export default App;
