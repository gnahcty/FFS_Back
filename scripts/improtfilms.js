import "dotenv/config";
import mongoose from "mongoose";
import filmsData from "../films.json" with { type: "json" };
import Film from "../models/filmSchema.js";
import Screening from "../models/screeningSchema.js";
import List from "../models/listSchema.js";

const requiredEnvVars = ["DB_URL"];

const missingEnvVars = requiredEnvVars.filter(
  (envVar) => !process.env[envVar] || process.env[envVar].trim() === "",
);

if (missingEnvVars.length > 0) {
  console.error(
    `Missing required environment variables: ${missingEnvVars.join(", ")}`,
  );
  process.exit(1);
}

const DEFAULT_FORMAT = "未提供";
const DEFAULT_COLOR = "未提供";

const extractYearsFromText = (value) => {
  const matches = String(value).match(/\b(19|20)\d{2}\b/g) ?? [];
  return matches.map(Number);
};

const detectFestivalYear = (films) => {
  const years = films.flatMap((film) => {
    const textParts = [
      film.url,
      film.category,
      film.title_en,
      film.title_zh,
      film.country,
      film.synopsis,
      film.year,
      ...(film.awards ?? []),
      ...(film.images ?? []),
    ];

    return textParts.flatMap(extractYearsFromText);
  });

  if (years.length === 0) {
    throw new Error("Unable to detect festival year from films.json");
  }

  return Math.max(...years);
};

const parseDurationMinutes = (duration) => {
  const match = duration.match(/\d+/);
  return match ? Number(match[0]) : 0;
};

const buildScreeningDate = (festivalYear, screening) => {
  const [month, day] = screening.date.split(".").map(Number);
  const [hours, minutes] = screening.time.split(":").map(Number);
  const screeningDate = new Date(festivalYear, month - 1, day, hours, minutes);

  if (Number.isNaN(screeningDate.getTime())) {
    throw new Error(`Invalid screening date: ${JSON.stringify(screening)}`);
  }

  return screeningDate;
};

const mapFilmDocument = (film) => ({
  CName: film.title_zh,
  EName: film.title_en,
  category: film.category,
  photos: film.images ?? [],
  region: film.country,
  release_year: film.year,
  format: DEFAULT_FORMAT,
  color: DEFAULT_COLOR,
  length: film.duration,
  rating: film.rating,
  awards: film.awards ?? [],
  description: film.synopsis,
  directors: (film.directors ?? []).map(
    (director) => director.name_zh || director.name_en,
  ),
});

const importFilms = async () => {
  await mongoose.connect(process.env.DB_URL);
  mongoose.set("sanitizeFilter", true);

  try {
    const festivalYear = detectFestivalYear(filmsData);

    await List.deleteMany({});
    await Screening.deleteMany({});
    await Film.deleteMany({});

    for (const filmData of filmsData) {
      const film = await Film.create(mapFilmDocument(filmData));
      const durationMinutes = parseDurationMinutes(filmData.duration);

      const screenings = (filmData.screenings ?? []).map((screening) => {
        const startTime = buildScreeningDate(festivalYear, screening);
        const endTime = new Date(
          startTime.getTime() + durationMinutes * 60 * 1000,
        );

        return {
          film: film._id,
          place: screening.venue,
          time: startTime,
          endTime,
          QASessions: Boolean(screening.filmmaker_attendance),
        };
      });

      if (screenings.length > 0) {
        await Screening.insertMany(screenings);
      }
    }

    const filmCount = await Film.countDocuments();
    const screeningCount = await Screening.countDocuments();
    const earliestScreening = await Screening.findOne()
      .sort({ time: 1 })
      .lean();
    const latestScreening = await Screening.findOne().sort({ time: -1 }).lean();

    console.log(
      JSON.stringify(
        {
          success: true,
          films: filmCount,
          screenings: screeningCount,
          festivalStart: earliestScreening?.time ?? null,
          festivalEnd: latestScreening?.time ?? null,
        },
        null,
        2,
      ),
    );
  } finally {
    await mongoose.disconnect();
  }
};

importFilms().catch((error) => {
  console.error(error);
  process.exit(1);
});
