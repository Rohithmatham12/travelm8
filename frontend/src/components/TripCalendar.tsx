import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns';
import { ItineraryItem } from '../types/trip';
import './TripCalendar.css';

interface TripCalendarProps {
  startDate: string;
  endDate: string;
  itinerary?: ItineraryItem[];
  onDateClick?: (date: Date) => void;
}

const TripCalendar: React.FC<TripCalendarProps> = ({ 
  startDate, 
  endDate, 
  itinerary = [],
  onDateClick 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(startDate));

  const start = new Date(startDate);
  const end = new Date(endDate);
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get items for a specific date
  const getItemsForDate = (date: Date): ItineraryItem[] => {
    return itinerary.filter(item => {
      const itemDate = new Date(item.date);
      return isSameDay(itemDate, date);
    });
  };

  // Check if date is within trip range
  const isInTripRange = (date: Date): boolean => {
    return date >= start && date <= end;
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Get day of week for first day of month
  const firstDayOfWeek = monthStart.getDay();

  return (
    <div className="trip-calendar">
      <div className="calendar-header">
        <button onClick={goToPreviousMonth} className="calendar-nav-btn">
          ←
        </button>
        <h3>{format(currentMonth, 'MMMM yyyy')}</h3>
        <button onClick={goToNextMonth} className="calendar-nav-btn">
          →
        </button>
      </div>

      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
        </div>

        <div className="calendar-days">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: firstDayOfWeek }).map((_, index) => (
            <div key={`empty-${index}`} className="calendar-day empty"></div>
          ))}

          {/* Days of the month */}
          {daysInMonth.map(day => {
            const items = getItemsForDate(day);
            const isInRange = isInTripRange(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={`calendar-day ${isInRange ? 'in-range' : ''} ${isToday ? 'today' : ''} ${items.length > 0 ? 'has-items' : ''}`}
                onClick={() => onDateClick?.(day)}
              >
                <div className="day-number">{format(day, 'd')}</div>
                {items.length > 0 && (
                  <div className="day-items">
                    {items.slice(0, 3).map((item, index) => (
                      <div key={item.id || index} className="day-item" title={item.title}>
                        {item.type === 'accommodation' && '🏨'}
                        {item.type === 'transport' && '🚗'}
                        {item.type === 'activity' && '🎯'}
                        {item.type === 'meal' && '🍽️'}
                        {item.type === 'other' && '📍'}
                      </div>
                    ))}
                    {items.length > 3 && (
                      <div className="day-item-more">+{items.length - 3}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-color in-range"></span>
          <span>Trip dates</span>
        </div>
        <div className="legend-item">
          <span className="legend-color has-items"></span>
          <span>Has activities</span>
        </div>
        <div className="legend-item">
          <span className="legend-color today"></span>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
};

export default TripCalendar;

