const Card = ({ children, className = "" }) => (
  <div
    className={`rounded-2xl shadow-sm border border-gray-200 p-5 bg-white ${className}`}
  >
    {children}
  </div>
);
const Badge = ({ children }) => (
  <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium text-gray-700 bg-gray-50">
    {children}
  </span>
);
export default function AppointmentTable({ items, emptyText }) {
  //if (!items || items.length === 0) return <Card>{emptyText}</Card>;
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
