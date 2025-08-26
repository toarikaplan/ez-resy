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
async function checkForExistingBooking() {
  const config = existingReservationConfig(process.env.AUTH_TOKEN);
  const venueId = process.env.VENUE_ID;
  const targetDate = process.env.DATE; // YYYY-MM-DD

  try {
    const response = await axios.request(config);
    const reservations = response?.data?.reservations || [];

    // Check if any reservation matches both venue and date
    const hasSameVenueAndDate = reservations.some((r) => {
      const resVenueId = r?.venue?.id;

      // Resy objects can expose date on different fields
      const resDateRaw = r?.date || r?.scheduled_at || r?.booked_at;
      if (!resDateRaw) return false;

      // Normalize to YYYY-MM-DD
      const resDate =
        typeof resDateRaw === "string" ? resDateRaw.split("T")[0] : null;

      return (
        String(resVenueId) === String(venueId) && resDate === targetDate
      );
    });

    if (hasSameVenueAndDate) {
      console.log(
        `You already have a reservation for this venue on ${convertDateToLongFormat(
          targetDate
        )}.`
      );
      return true;
    }

    // If there are reservations, but not for this venue/date
    if (reservations.length > 0) {
      const first = reservations[0];
      console.log(
        `Existing upcoming reservation found at venue ${first?.venue?.id}, but not for ${targetDate}. Continuing...`
      );
      return false;
    }

    console.log("Found no upcoming reservations.");
    return false;
  } catch (error) {
    console.log(error);
    return false;
  }
}

  
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
