import './QRJourney.css';

export function QRJourney() {
  return (
    <div className="journey-container">
      {/* Background columns */}
      <div className="journey-columns-bg">
        {Array.from({ length: 16 }, (_, i) => (
          <div key={i} />
        ))}
      </div>
      
      {/* Content grid */}
      <div className="journey-grid">
        {/* Content goes here */}
      </div>
    </div>
  );
}