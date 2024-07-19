import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Getremainder.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt, faEdit, faTimes } from '@fortawesome/free-solid-svg-icons';
import moment from 'moment-timezone';


const Getremainder = () => {
  const [remainders, setRemainders] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentReminder, setCurrentReminder] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');

  

  useEffect(() => {
    const fetchRemainders = async () => {
      try {
        const response = await axios.get('https://demo.harishkumarvn.me/remainder');
        setRemainders(response.data);
      } catch (error) {
        console.error('Error fetching remainders:', error);
      }
    };

    fetchRemainders();
  }, []);

    
  const daysRemaining = (date) => {
  const currentDate = moment().tz('America/New_York').startOf('day'); // Start of current day in New York time
  const reminderDate = moment(date); // Convert reminder date to moment object
  const differenceInDays = reminderDate.diff(currentDate, 'days');

  if (differenceInDays < 0) {
    return 'Expired';
  }
  else {
    return differenceInDays + ' days';
  }
};
    
     const handleDelete = async (id) => {
    try {
      await axios.delete(`https://demo.harishkumarvn.me/remainder/${id}`);
      // Update remainders state after successful deletion
      setRemainders(remainders.filter(remainder => remainder.id !== id));
      console.log('Reminder deleted successfully.');
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
     };
    
    const handleUpdateClick = (reminder) => {
    setIsUpdating(true);
    setCurrentReminder(reminder);
    setTitle(reminder.title);
    setDescription(reminder.description);
    setDate(reminder.date);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const updatedReminder = { title, description, date };
    try {
      const response = await axios.put(`https://demo.harishkumarvn.me/remainder/${currentReminder.id}`, updatedReminder);
      if (response.status === 200) {
        setRemainders(remainders.map(reminder => reminder.id === currentReminder.id ? response.data : reminder));
        setIsUpdating(false);
        setCurrentReminder(null);
        setTitle('');
        setDescription('');
        setDate('');
      }
    } catch (error) {
      console.error('Error updating reminder:', error);
    }
      window.location.reload();
  };
    
    const handleCloseUpdateForm = () => {
    setIsUpdating(false);
    setCurrentReminder(null);
    setTitle('');
    setDescription('');
    setDate('');
    };
  
  const handleCheckboxChange = async (id, completed) => {
    try {
      const response = await axios.patch(`https://demo.harishkumarvn.me/remainder/${id}`, { completed });
      if (response.status === 200) {
        setRemainders(remainders.map(reminder => reminder.id === id ? { ...reminder, completed } : reminder));
      }
    } catch (error) {
      console.error('Error updating reminder status:', error);
    }
  };


    return (
        <div>
             {isUpdating && (
        <div className='update-form'>
          <h2>Update Reminder</h2>
          <form onSubmit={handleUpdate}>
            <label>
              Title:
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </label>
            <label>
              Description:
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
            </label>
            <label>
              Date:
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </label>
                      <button type="submit" >Update</button>
                      <button type="button" onClick={handleCloseUpdateForm} className='close-button'>
              <FontAwesomeIcon icon={faTimes} /> Close
            </button>
          </form>
        </div>
                )}
      <div className='remainder-container'>
          
      {remainders.map((remainder) => (
        <div key={remainder.id} className='card'>
          <h3>{remainder.title}</h3>
          <p>{remainder.description}</p>
          <p>Date: {remainder.date}</p>
          <p className='highlight'>Days Remaining: {daysRemaining(remainder.date)}</p>
           <p>
              Completed:
              <input type="checkbox" checked={remainder.completed} onChange={(e) => handleCheckboxChange(remainder.id, e.target.checked)} />
            </p>
          <div className='button-container'>
            <button className='delete-button' onClick={() => handleDelete(remainder.id)}><FontAwesomeIcon icon={faTrashAlt} /> Delete</button>
            <button className='update-button' onClick={() => handleUpdateClick(remainder)}><FontAwesomeIcon icon={faEdit} /> Update</button>
          </div>
        </div>
      ))}
          </div>
    </div>
  );
}

export default Getremainder;
