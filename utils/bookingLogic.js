import axios from "axios";
import FormData from "form-data";
import { slotParser } from "./slotParser.js";
import { convertDateToLongFormat } from "./helpers.js";
import {
  existingReservationConfig,
  slotConfig,
  bookingConfig,
  finalConfig,
} from "../config.js";

// First, we'll see if we already have a reservation
async function checkForExisting Booking() { const config existingReservationConfig(process.env.AUTH_TOKEN); const venueId process.env. VENUE 10; process.env. DATE; // YYYY-MM-DD const targetDate

try {

const response await axios.request(config);

const reservations response?.data?.reservations:

// Determine if there is an existing reservation for the same venue AND date

const has SameVenueAndDate reservations.some((r)

const resVenueIdr?. venue?.id;

// Resy reservation objects usually expose date on r.date or r.scheduled at; support both

const resDateRow r?.date 11 r7. scheduled_at 11 r7.booked_at; if (!resDateRaw) return false; //Normalize to YYYY-MM-DD }); const resDate typeof resDateRaw 'string'? resDateRaw.split('T')[0]:'" return String(resVenueId) String (venueId) && resDate - targetDate;

if (has SameVenueAndDate) {

console.log('You already have a reservation for this venue on $(convertDateToLongFormat(targetDate))."); return true;

// If we have upcoming reservations but not for this date/venue, continue

if (reservations.length > 0) {

const first reservations[0]; e console.log('Existing upcoming reservation found at venue $(first?.venue?.id), but not for $(targetDate). Continuing...); ) else (

console.log('Found no upcoming reservations.');

return false;

} catch (error) {

console.log(error);
  }}
  
// Then, we'll check to see if there are any reservations available
async function fetchDataAndParseSlots() {
  try {
    const response = await axios.request(slotConfig);
    if (response.data.results.venues.length === 0) {
      console.log(
        "No slots available. Please run again after reservations open.",
      );
      return false;
    }
    console.log(
      `Checking for reservations at ${
        response.data.results.venues[0].venue.name
      } on ${convertDateToLongFormat(process.env.DATE)} for ${
        process.env.PARTY_SIZE
      } people...`,
    );
    let slots = response.data.results.venues[0].slots;
    const slotId = await slotParser(slots);
    return slotId;
  } catch (error) {
    console.log(error);
  }
}

// If there are reservations available, we'll grab the booking token
async function getBookingConfig(slotId) {
  try {
    const response = await axios.request(bookingConfig(slotId));
    return response.data.book_token.value;
  } catch (error) {
    console.log(error);
  }
}

// Finally, we'll make the reservation
async function makeBooking(book_token) {
  let config = finalConfig(process.env.AUTH_TOKEN);
  const formData = new FormData();
  formData.append(
    "struct_payment_method",
    JSON.stringify({ id: process.env.PAYMENT_ID }),
  );
  formData.append("book_token", book_token);
  formData.append("source_id", "resy.com-venue-details");

  try {
    const response = await axios.post(config.url, formData, {
      headers: {
        ...config.headers,
        ...formData.getHeaders(),
      },
    });
    return response.data;
  } catch (error) {
    console.log(error.response.data);
  }
}

export {
  checkForExistingBooking,
  fetchDataAndParseSlots,
  getBookingConfig,
  makeBooking,
};
