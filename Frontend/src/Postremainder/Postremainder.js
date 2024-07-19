import React, { useState, useEffect } from 'react';
import './Postremainder.css';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt, faEdit, faTimes } from '@fortawesome/free-solid-svg-icons';
import moment from 'moment-timezone';

const Postremainder = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [todayReminders, setTodayReminders] = useState([]);
  // const [date, setDate] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentReminder, setCurrentReminder] = useState(null);
  const [remainders, setRemainders] = useState([]);

  // State variables specifically for the update form
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateDescription, setUpdateDescription] = useState('');
  const [updateDate, setUpdateDate] = useState('');

  useEffect(() => {
    fetchAllReminders();
  }, []);

  const fetchAllReminders = async () => {
    try {
      const response = await axios.get('https://demo.harishkumarvn.me/remainder');
      const allReminders = response.data;

      // Get today's date in EST
      const todayDate = moment().tz('America/New_York').format('YYYY-MM-DD');

      // Filter reminders for today's date in EST
      const filteredReminders = allReminders.filter(reminder => {
        const reminderDate = moment(reminder.date).tz('America/New_York').format('YYYY-MM-DD');
        return reminderDate === todayDate;
      });
      setTodayReminders(filteredReminders);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { title, description, date: deadline };
    try {
      const response = await axios.post('https://demo.harishkumarvn.me/remainder', data);
      if (response.status === 201) {
        console.log('Form submitted successfully');
        setTitle('');
        setDescription('');
        setDeadline('');
        fetchAllReminders(); // Update reminders after new submission
      } else {
        console.error('Form submission failed');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`https://demo.harishkumarvn.me/remainder/${id}`);
      setTodayReminders(todayReminders.filter(reminder => reminder.id !== id));
      console.log('Reminder deleted successfully.');
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  const handleUpdateClick = (reminder) => {
    setIsUpdating(true);
    setCurrentReminder(reminder);
    // Set update form fields to current reminder's values
    setUpdateTitle(reminder.title);
    setUpdateDescription(reminder.description);
    setUpdateDate(reminder.date);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const updatedReminder = { title: updateTitle, description: updateDescription, date: updateDate };
    try {
      const response = await axios.put(`https://demo.harishkumarvn.me/remainder/${currentReminder.id}`, updatedReminder);
      if (response.status === 200) {
        // Update state with updated reminder data
        setRemainders(remainders.map(reminder => reminder.id === currentReminder.id ? { ...reminder, ...response.data } : reminder));
        setIsUpdating(false);
        setCurrentReminder(null);
        // Clear update form fields after successful update
        setUpdateTitle('');
        setUpdateDescription('');
        setUpdateDate('');
      }
    } catch (error) {
      console.error('Error updating reminder:', error);
    }
     window.location.reload();
  };

  const handleCloseUpdateForm = () => {
    setIsUpdating(false);
    setCurrentReminder(null);
    setUpdateTitle('');
    setUpdateDescription('');
    setUpdateDate('');
  };

  const handleCheckboxChange = async (id, completed) => {
    try {
      const response = await axios.patch(`https://demo.harishkumarvn.me/remainder/${id}`, { completed });
      console.log('Backend response:', response.data);
      if (response.status === 200) {
        // Update both today's reminders and all reminders with updated completed status
        setRemainders(remainders.map(reminder => reminder.id === id ? { ...reminder, completed } : reminder));
        setTodayReminders(todayReminders.map(reminder => reminder.id === id ? { ...reminder, completed } : reminder));
      }
    } catch (error) {
      console.error('Error updating reminder status:', error);
    }
  };

  return (
    <div>
      <div className='my-form'>
        <form onSubmit={handleSubmit}>
          <label>
            Title:
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <br /> <br />
          <label>
            Description:
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
          </label>
          <br /> <br />
          <label>
            Deadline:
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} required />
          </label>
          <br /><br /><br />
          <button className="submitbutton" type="submit">Submit</button>
        </form>
      </div>

      {isUpdating && (
        <div className='update-form'>
          <h2>Update Reminder</h2>
          <form onSubmit={handleUpdate}>
            <label>
              Title:
              <input type="text" value={updateTitle} onChange={(e) => setUpdateTitle(e.target.value)} required />
            </label>
            <label>
              Description:
              <textarea value={updateDescription} onChange={(e) => setUpdateDescription(e.target.value)} required />
            </label>
            <label>
              Date:
              <input type="date" value={updateDate} onChange={(e) => setUpdateDate(e.target.value)} required />
            </label>
            <button type="submit" >Update</button>
            <button type="button" onClick={handleCloseUpdateForm} className='close-button'>
              <FontAwesomeIcon icon={faTimes} /> Close
            </button>
          </form>
        </div>
      )}

      <div className='today-reminders'>
        <h2>Today's Reminders</h2>
        <div className='reminder-cards'>
          {todayReminders.map((reminder) => (
            <div key={reminder.id} className='cardpost'>
              <h3>{reminder.title}</h3>
              <p>{reminder.description}</p>
              <p>
                Completed:
                <input type="checkbox" checked={reminder.completed} onChange={(e) => handleCheckboxChange(reminder.id, e.target.checked)} />
              </p>
              <div className='post-button-container'>
                <button className='post-delete-button' onClick={() => handleDelete(reminder.id)}><FontAwesomeIcon icon={faTrashAlt} /> Delete</button>
                <button className='post-update-button' onClick={() => handleUpdateClick(reminder)}><FontAwesomeIcon icon={faEdit} /> Update</button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

export default Postremainder;
