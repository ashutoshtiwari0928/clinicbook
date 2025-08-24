import React, { useMemo, useState, createContext, useContext } from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate, useParams, Navigate } from "react-router-dom";

// ---- Minimal design helpers (Tailwind assumed available by the canvas preview) ----
const Container = ({ children }) => (
  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</div>
);

const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl shadow-sm border border-gray-200 p-5 bg-white ${className}`}>{children}</div>
);

const Input = (props) => (
  <input
    {...props}
    className={`w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10 ${props.className || ""}`}
  />
);

const Select = ({ value, onChange, children, className = "" }) => (
  <select
    value={value}
    onChange={onChange}
    className={`w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/10 ${className}`}
  >
    {children}
  </select>
);

const Button = ({ children, className = "", ...props }) => (
  <button
    {...props}
    className={`rounded-2xl px-4 py-2 font-medium transition-colors bg-black text-white hover:bg-black/90 disabled:opacity-50 ${className}`}
  >
    {children}
  </button>
);

const Badge = ({ children }) => (
  <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-50">
    {children}
  </span>
);

// ---- Mock Data & Utilities ----
const DEFAULT_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
];

function daysFromToday(n = 0) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10); // yyyy-mm-dd
}

function titleCase(s){ return s.replace(/\b\w/g, (c) => c.toUpperCase()); }

const initialDoctors = [
  {
    id: 1,
    name: "Dr. Aayush Sharma",
    specialization: "Cardiologist",
    location: "Kathmandu",
    rating: 4.8,
    fee: 1200,
    slots: DEFAULT_SLOTS,
    bookings: {
      [daysFromToday(0)]: ["09:00"],
      [daysFromToday(1)]: ["10:30", "13:00"],
    },
    bio: "Fellow of Cardiology with 10+ years in interventional procedures and preventive care.",
  },
  {
    id: 2,
    name: "Dr. Sita Koirala",
    specialization: "Dermatologist",
    location: "Lalitpur",
    rating: 4.6,
    fee: 900,
    slots: DEFAULT_SLOTS,
    bookings: {
      [daysFromToday(0)]: ["11:00", "15:00"],
    },
    bio: "Board-certified dermatologist specializing in acne, hair loss, and cosmetic dermatology.",
  },
  {
    id: 3,
    name: "Dr. Bijay Thapa",
    specialization: "Pediatrician",
    location: "Bhaktapur",
    rating: 4.7,
    fee: 800,
    slots: DEFAULT_SLOTS,
    bookings: {},
    bio: "Pediatrics and child wellness. Gentle, evidence-driven care for kids and teens.",
  },
];

// ---- Contexts: Auth + Data ----
const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

const DataContext = createContext(null);
const useData = () => useContext(DataContext);

function AppProviders({ children }) {
  const [user, setUser] = useState(null); // {name, role: 'doctor' | 'patient', email}
  const [doctors, setDoctors] = useState(initialDoctors);
  const [appointments, setAppointments] = useState([]); // {id, doctorId, doctorName, patientName, patientEmail, date, time, status}

  const login = (email, role) => {
    const nameGuess = email?.split("@")[0] || (role === "doctor" ? "Doctor" : "Patient");
    setUser({ email, name: titleCase(nameGuess.replace(/\./g, " ")), role });
  };
  const logout = () => setUser(null);

  const book = ({ doctorId, date, time }) => {
    const doc = doctors.find((d) => d.id === Number(doctorId));
    if (!doc) throw new Error("Doctor not found");

    // prevent double booking
    const taken = (doc.bookings?.[date] || []);
    if (taken.includes(time)) {
      throw new Error("That slot is already booked.");
    }

    // create appointment
    const appt = {
      id: Date.now(),
      doctorId: doc.id,
      doctorName: doc.name,
      patientName: user?.name || "Guest",
      patientEmail: user?.email || "",
      date,
      time,
      status: "confirmed",
    };

    // update data stores
    setAppointments((prev) => [appt, ...prev]);
    setDoctors((prev) =>
      prev.map((d) => {
        if (d.id !== doc.id) return d;
        const booked = { ...(d.bookings || {}) };
        booked[date] = [...(booked[date] || []), time];
        return { ...d, bookings: booked };
      })
    );
    return appt;
  };

  const cancel = (appointmentId) => {
    const found = appointments.find((a) => a.id === appointmentId);
    if (!found) return;
    setAppointments((prev) => prev.map((a) => (a.id === appointmentId ? { ...a, status: "cancelled" } : a)));
  };

  const valueAuth = useMemo(() => ({ user, login, logout }), [user]);
  const valueData = useMemo(() => ({ doctors, setDoctors, appointments, setAppointments, book, cancel }), [doctors, appointments]);

  return (
    <AuthContext.Provider value={valueAuth}>
      <DataContext.Provider value={valueData}>{children}</DataContext.Provider>
    </AuthContext.Provider>
  );
}

// ---- Layout ----
function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b">
      <Container>
        <div className="flex items-center justify-between py-3">
          <Link to="/" className="font-bold text-lg">HealthBook</Link>
          <div className="flex items-center gap-3">
            <Link className="hover:underline" to="/doctors">Find Doctors</Link>
            {user?.role === "doctor" && (
              <Link className="hover:underline" to="/dashboard/doctor">Doctor Dashboard</Link>
            )}
            {user?.role === "patient" && (
              <Link className="hover:underline" to="/dashboard/patient">My Appointments</Link>
            )}
            {!user && (
              <Link to="/login">
                <Button>Login</Button>
              </Link>
            )}
            {!!user && (
              <div className="flex items-center gap-2">
                <Badge>{user.role}</Badge>
                <span className="text-sm text-gray-600 hidden sm:inline">{user.name}</span>
                <Button onClick={logout} className="bg-gray-900">Logout</Button>
              </div>
            )}
          </div>
        </div>
      </Container>
    </nav>
  );
}

function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />
      <Container>{children}</Container>
      <footer className="border-t mt-16">
        <Container>
          <div className="py-6 text-sm text-gray-500 flex justify-between">
            <span>© {new Date().getFullYear()} HealthBook</span>
            <span>Demo build · React + Tailwind</span>
          </div>
        </Container>
      </footer>
    </div>
  );
}

// ---- Auth & Guards ----
function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (user) return <Navigate to={user.role === "doctor" ? "/dashboard/doctor" : "/dashboard/patient"} replace />;

  const submit = (e) => {
    e.preventDefault();
    login(email || `${role}@example.com`, role);
    navigate(role === "doctor" ? "/dashboard/doctor" : "/dashboard/patient");
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto">
        <Card>
          <h1 className="text-2xl font-semibold mb-2">Welcome back</h1>
          <p className="text-gray-500 mb-6">Login as a doctor or patient.</p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Role</label>
              <Select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1">
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={`${role}@example.com`} />
            </div>
            <div>
              <label className="text-sm font-medium">Password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full">Login</Button>
          </form>
        </Card>
      </div>
    </Layout>
  );
}

function RequireAuth({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

// ---- Home ----
function HomePage() {
  return (
    <Layout>
      <div className="grid md:grid-cols-2 gap-6 items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Book a doctor in minutes</h1>
          <p className="text-gray-600 mb-6">Search specialists, compare availability and fees, and confirm a time that works for you.</p>
          <div className="flex gap-3">
            <Link to="/doctors"><Button>Browse Doctors</Button></Link>
            <Link to="/login"><Button className="bg-gray-900">Login</Button></Link>
          </div>
        </div>
        <Card className="md:ml-auto">
          <ul className="space-y-3 text-sm">
            <li>• Role-based auth (Doctor / Patient)</li>
            <li>• Browse & filter doctors</li>
            <li>• Real-time slot conflict checks</li>
            <li>• Doctor & Patient dashboards</li>
          </ul>
        </Card>
      </div>
    </Layout>
  );
}

// ---- Doctors ----
function DoctorCard({ doctor }) {
  const { id, name, specialization, location, rating, fee } = doctor;
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-lg">{name}</h3>
          <p className="text-sm text-gray-600">{specialization} · {location}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge>{rating.toFixed(1)} ★</Badge>
            <Badge>Rs. {fee}</Badge>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Link to={`/doctors/${id}`} className="underline text-sm">View Profile</Link>
          <Link to={`/book/${id}`}>
            <Button>Book</Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

function BrowseDoctorsPage() {
  const { doctors } = useData();
  const [q, setQ] = useState("");
  const [spec, setSpec] = useState("");
  const [city, setCity] = useState("");

  const specs = Array.from(new Set(doctors.map((d) => d.specialization)));
  const cities = Array.from(new Set(doctors.map((d) => d.location)));

  const filtered = doctors.filter((d) =>
    (!q || d.name.toLowerCase().includes(q.toLowerCase())) &&
    (!spec || d.specialization === spec) &&
    (!city || d.location === city)
  );

  return (
    <Layout>
      <div className="grid lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 h-max">
          <h2 className="font-semibold mb-3">Filters</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Search</label>
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Doctor name" />
            </div>
            <div>
              <label className="text-sm font-medium">Specialization</label>
              <Select value={spec} onChange={(e) => setSpec(e.target.value)}>
                <option value="">All</option>
                {specs.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">City</label>
              <Select value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">All</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
          </div>
        </Card>
        <div className="lg:col-span-3 space-y-4">
          <h1 className="text-2xl font-semibold">Browse Doctors</h1>
          {filtered.length === 0 && <Card>No doctors match your filters.</Card>}
          <div className="grid md:grid-cols-2 gap-4">
            {filtered.map((doc) => (
              <DoctorCard key={doc.id} doctor={doc} />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

function DoctorProfilePage() {
  const { doctors } = useData();
  const { id } = useParams();
  const doctor = doctors.find((d) => d.id === Number(id));
  if (!doctor) return <Layout><Card>Doctor not found.</Card></Layout>;
  return (
    <Layout>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <h1 className="text-2xl font-semibold">{doctor.name}</h1>
            <p className="text-gray-600">{doctor.specialization} · {doctor.location}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge>{doctor.rating.toFixed(1)} ★</Badge>
              <Badge>Rs. {doctor.fee}</Badge>
            </div>
            <p className="mt-4 text-gray-700">{doctor.bio}</p>
          </Card>
          <Card>
            <h2 className="font-semibold mb-3">Booked Times</h2>
            <BookedTimes doctor={doctor} />
          </Card>
        </div>
        <Card className="md:col-span-1 h-max">
          <h2 className="font-semibold mb-3">Book an Appointment</h2>
          <Link to={`/book/${doctor.id}`}>
            <Button className="w-full">Choose Date & Time</Button>
          </Link>
        </Card>
      </div>
    </Layout>
  );
}

function BookedTimes({ doctor }) {
  const dates = Object.keys(doctor.bookings || {}).sort();
  if (dates.length === 0) return <div className="text-sm text-gray-600">No bookings yet.</div>;
  return (
    <div className="space-y-3">
      {dates.map((d) => (
        <div key={d}>
          <div className="text-sm font-medium mb-1">{d}</div>
          <div className="flex flex-wrap gap-2">
            {(doctor.bookings[d] || []).map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- Booking ----
function BookAppointmentPage() {
  const { doctors, book } = useData();
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const doctor = doctors.find((d) => d.id === Number(id));

  const [date, setDate] = useState(daysFromToday(0));
  const [time, setTime] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  if (!doctor) return <Layout><Card>Doctor not found.</Card></Layout>;

  const taken = doctor.bookings?.[date] || [];
  const available = doctor.slots.filter((s) => !taken.includes(s));

  const submit = (e) => {
    e.preventDefault();
    setErr("");
    setOk("");
    if (!time) return setErr("Please select a time.");
    try {
      const appt = book({ doctorId: doctor.id, date, time });
      setOk(`Booked ${appt.date} @ ${appt.time} with ${doctor.name}`);
      setTimeout(() => navigate(user?.role === "doctor" ? "/dashboard/doctor" : "/dashboard/patient"), 800);
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <Layout>
      <div className="max-w-xl mx-auto">
        <Card>
          <h1 className="text-2xl font-semibold mb-2">Book with {doctor.name}</h1>
          <p className="text-gray-600 mb-4">{doctor.specialization} · Rs. {doctor.fee}</p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} min={daysFromToday(0)} />
            </div>
            <div>
              <label className="text-sm font-medium">Time</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {doctor.slots.map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={(doctor.bookings?.[date] || []).includes(s)}
                    onClick={() => setTime(s)}
                    className={`px-3 py-1 rounded-full border text-sm ${time === s ? "bg-black text-white" : "bg-white"} disabled:opacity-40`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            {err && <div className="text-sm text-red-600">{err}</div>}
            {ok && <div className="text-sm text-green-700">{ok}</div>}
            <Button type="submit" className="w-full">Confirm Booking</Button>
          </form>
        </Card>
      </div>
    </Layout>
  );
}

// ---- Dashboards ----
function PatientDashboardPage() {
  const { user } = useAuth();
  const { appointments } = useData();
  const my = appointments.filter((a) => a.patientEmail === user?.email || a.patientName === user?.name);
  return (
    <Layout>
      <h1 className="text-2xl font-semibold mb-4">My Appointments</h1>
      <AppointmentTable items={my} emptyText="No appointments yet. Book one from Find Doctors." />
    </Layout>
  );
}

function DoctorDashboardPage() {
  const { user } = useAuth();
  const { appointments, doctors } = useData();
  // Tie doctor's email name to doctor 1 for demo if role is doctor
  const doc = doctors[0];
  const my = appointments.filter((a) => a.doctorId === doc.id);

  return (
    <Layout>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <h1 className="text-2xl font-semibold mb-4">Welcome, {user?.name}</h1>
          <Card>
            <h2 className="font-semibold mb-3">Upcoming Appointments</h2>
            <AppointmentTable items={my} emptyText="No appointments yet." />
          </Card>
        </div>
        <Card>
          <h2 className="font-semibold mb-3">Today's Booked Times</h2>
          <div className="flex flex-wrap gap-2">
            {(doc.bookings?.[daysFromToday(0)] || []).length === 0 ? (
              <span className="text-sm text-gray-600">No bookings today.</span>
            ) : (
              (doc.bookings?.[daysFromToday(0)] || []).map((t) => <Badge key={t}>{t}</Badge>)
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}

function AppointmentTable({ items, emptyText }) {
  if (!items || items.length === 0) return <Card>{emptyText}</Card>;
  return (
    <div className="overflow-hidden rounded-2xl border">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr className="text-left">
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3">Doctor</th>
            <th className="px-4 py-3">Patient</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((a) => (
            <tr key={a.id} className="border-t">
              <td className="px-4 py-3">{a.date}</td>
              <td className="px-4 py-3">{a.time}</td>
              <td className="px-4 py-3">{a.doctorName}</td>
              <td className="px-4 py-3">{a.patientName}</td>
              <td className="px-4 py-3">
                <Badge>{a.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---- Root App with Routes ----
function AppRouter() {
  return (
    <BrowserRouter>
      <AppProviders>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/doctors" element={<BrowseDoctorsPage />} />
          <Route path="/doctors/:id" element={<DoctorProfilePage />} />
          <Route path="/book/:id" element={<RequireAuth role={undefined}><BookAppointmentPage /></RequireAuth>} />
          <Route path="/dashboard/patient" element={<RequireAuth role="patient"><PatientDashboardPage /></RequireAuth>} />
          <Route path="/dashboard/doctor" element={<RequireAuth role="doctor"><DoctorDashboardPage /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppProviders>
    </BrowserRouter>
  );
}

export default AppRouter;
