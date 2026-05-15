import React, { useState } from 'react';
import './Scheduling.css';

const Scheduling: React.FC = () => {
  const [activeFrequency, setActiveFrequency] = useState('Daily');

  const timeSlots = [
    { time: "07:00 AM - 08:30 AM", label: "Morning Prime" },
    { time: "12:00 PM - 01:30 PM", label: "Peak Performance" },
    { time: "06:30 PM - 08:00 PM", label: "Recovery Window" }
  ];

  return (
    <div className="scheduling-page">
      <section className="scheduling-hero">
        <span className="s-label">LOGISTICS ENGINE</span>
        <h1 className="sakana-title">MEAL <span className="lime-text">SCHEDULING</span></h1>
        <p>Sync your nutrition with your training blocks. Define your windows, and our flash-delivery network handles the rest.</p>
      </section>

      <div className="scheduling-grid">
        {/* Left: Frequency Selection */}
        <div className="sched-card frequency-card">
          <h3>1. Delivery Frequency</h3>
          <div className="freq-options">
            {['Daily', 'Weekly Batch', 'Custom'].map(freq => (
              <button 
                key={freq} 
                className={`freq-btn ${activeFrequency === freq ? 'active' : ''}`}
                onClick={() => setActiveFrequency(freq)}
              >
                {freq}
              </button>
            ))}
          </div>
          <p className="helper-text">Daily deliveries ensure peak nutrient bioavailability.</p>
        </div>

        {/* Right: Time Slot Selection */}
        <div className="sched-card slots-card">
          <h3>2. Preferred Windows</h3>
          <div className="slots-list">
            {timeSlots.map((slot, i) => (
              <div key={i} className="slot-item">
                <div className="slot-info">
                  <strong>{slot.label}</strong>
                  <span>{slot.time}</span>
                </div>
                <input type="radio" name="timeslot" />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Summary/Calendar Mockup */}
        <div className="sched-card calendar-summary">
          <h3>3. Your Performance Cycle</h3>
          <div className="calendar-mock">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <div key={i} className={`cal-day ${i < 5 ? 'active-day' : ''}`}>
                <span>{day}</span>
                <div className="dot"></div>
              </div>
            ))}
          </div>
          <button className="save-schedule-btn">Update Logistics</button>
        </div>
      </div>
    </div>
  );
};

export default Scheduling;