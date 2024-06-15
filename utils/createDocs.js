import { data } from "../data.js";
import Film from "../models/filmSchema.js";
import Screening from "../models/screeningSchema.js";

export const createDocuments = async () => {
  try {
    for (const filmData of data) {
      const {
        CName,
        EName,
        category,
        photos,
        region,
        releaseYear,
        format,
        color,
        length,
        rating,
        awards,
        description,
        directors,
        screenings,
      } = filmData;

      // Create the Film document
      const film = new Film({
        CName,
        EName,
        category,
        photos,
        region,
        release_year: releaseYear,
        format,
        color,
        length,
        rating,
        awards,
        description,
        directors,
      });

      // Save the film document to the database
      const savedFilm = await film.save();

      // Create and save the Screening documents
      for (const screeningData of screenings) {
        const { date, time, place } = screeningData;

        // Construct the datetime for the screening
        // Combine date and time into a single Date object
        const [hours, minutes] = time.split(":").map(Number);
        const [month, day] = date.split(".").map(Number); // Assuming date is in "MM.DD" format
        const screeningDate = new Date(releaseYear); // Start with the release year
        screeningDate.setMonth(month - 1); // Months are zero-indexed
        screeningDate.setDate(day);
        screeningDate.setHours(hours);
        screeningDate.setMinutes(minutes);

        if (isNaN(screeningDate.getTime())) {
          throw new Error(
            `Invalid Date for screening: ${JSON.stringify(screeningData)}`
          );
        }

        const screening = new Screening({
          movie_id: savedFilm._id,
          place,
          time: screeningDate,
          QASessions: screeningData.QASessions || false,
        });

        await screening.save();
      }
    }
    console.log("Documents created successfully");
  } catch (error) {
    console.error("Error creating documents:", error);
  }
};
