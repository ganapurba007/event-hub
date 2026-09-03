require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const { Sequelize, DataTypes, Op } = require("sequelize");
const session = require("express-session");
const path = require("path");
const env = process.env;
const app = express();
const port = env.PORT;

// MIDDLEWARE
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  }),
);

// set view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const sequelize = new Sequelize(env.DB_NAME, env.DB_USERNAME, env.DB_PASSWORD, {
  host: env.DB_HOST || "localhost",
  dialect: "mysql",
  logging: false,
});

const User = sequelize.define(
  "User",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    password: { type: DataTypes.STRING(255), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    role: { type: DataTypes.STRING(10), defaultValue: "user" },
    avatar: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    tableName: "user",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

const Category = sequelize.define(
  "Category",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    icon: { type: DataTypes.STRING(50), allowNull: true },
  },
  {
    tableName: "categories",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);

const Event = sequelize.define(
  "Event",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    image_path: { type: DataTypes.STRING(255), allowNull: true },
    venue: { type: DataTypes.STRING(255), allowNull: false },
    event_date: { type: DataTypes.DATE, allowNull: false },
    event_end_date: { type: DataTypes.DATE, allowNull: false },
    max_attendees: { type: DataTypes.INTEGER, allowNull: false },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    available_tickets: { type: DataTypes.INTEGER, allowNull: false },
    city: { type: DataTypes.STRING(100), allowNull: false },
    is_published: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "events",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

const Order = sequelize.define(
  "Order",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    total_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "pending",
    },
    xendit_invoice_id: { type: DataTypes.STRING(255), allowNull: true },
    xendit_payment_url: { type: DataTypes.TEXT, allowNull: true },
    xendit_expiry_date: { type: DataTypes.DATE, allowNull: true },
  },
  {
    tableName: "orders",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

const Ticket = sequelize.define(
  "Ticket",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    ticket_code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    barcode_data: { type: DataTypes.TEXT, allowNull: true },
    attendee_name: { type: DataTypes.STRING(255), allowNull: false },
    attendee_email: { type: DataTypes.STRING(255), allowNull: false },
    attendee_phone: { type: DataTypes.STRING(20), allowNull: true },
  },
  {
    tableName: "tickets",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

const EventAttachment = sequelize.define(
  "EventAttachment",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    file_path: { type: DataTypes.STRING(255), allowNull: false },
    file_type: { type: DataTypes.STRING(10), defaultValue: "image" },
  },
  {
    tableName: "event_attachments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  },
);

// Relasi
User.hasMany(Event, {
  foreignKey: "creator_id",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

Event.belongsTo(User, {
  foreignKey: "creator_id",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

Category.hasMany(Event, {
  foreignKey: "category_id",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

Event.belongsTo(Category, {
  foreignKey: "category_id",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

User.hasMany(Order, {
  foreignKey: "user_id",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

Order.belongsTo(User, {
  foreignKey: "user_id",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

Event.hasMany(Order, {
  foreignKey: "event_id",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

Order.belongsTo(Event, {
  foreignKey: "event_id",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

Order.hasMany(Ticket, {
  foreignKey: "order_id",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

Ticket.belongsTo(Order, {
  foreignKey: "order_id",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

Event.hasMany(Ticket, {
  foreignKey: "event_id",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

Ticket.belongsTo(Event, {
  foreignKey: "event_id",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

Event.hasMany(EventAttachment, {
  foreignKey: "event_id",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

EventAttachment.belongsTo(Event, {
  foreignKey: "event_id",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

// CONTROLLERS
// INDEX
app.get("/", async (req, res) => {
  try {
    const categories = await Category.findAll();
    let cities = [];
    try {
      let citiesData = await Event.findAll({
        attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("city")), "city"]],
        where: { is_published: true },
        order: [["city", "ASC"]],
        raw: true,
      });
      if (!citiesData || citiesData.length === 0) {
        citiesData = await Event.findAll({
          attributes: [
            [Sequelize.fn("DISTINCT", Sequelize.col("city")), "city"],
          ],
          order: [["city", "ASC"]],
          raw: true,
        });
      }
      cities = citiesData
        .map((c) => c.city || (c.dataValues && c.dataValues.city))
        .filter(Boolean);
    } catch (error) {
      console.error("Error fetching cities:", error);
      cities = ["Jakarta", "Bandung", "Surabaya", "Yogyakarta"];
    }
    const latestEvents = await Event.findAll({
      where: { is_published: true },
      include: [Category, User],
      order: [["created_at", "DESC"]],
      limit: 6,
    });
    const upcomingEvents = await Event.findAll({
      where: { is_published: true, event_date: { [Op.gte]: new Date() } },
      include: [Category, User],
      order: [["event_date", "DESC"]],
      limit: 6,
    });
    res.render("home", {
      user: req.session.user,
      categories,
      cities,
      latestEvents,
      upcomingEvents,
    });
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).send("Internal Server Error");
  }
});
// END INDEX

// EVENTS
app.get("/events", async (req, res) => {
  try {
    const { category, city, search } = req.query;
    const where = { is_published: true };

    if (category) where.category_id = category;
    if (city) where.city = city;
    if (search) where.title = { [Op.like]: `%${search}%` };

    const events = await Event.findAll({
      where,
      include: [Category, User],
      order: [["event_date", "DESC"]],
    });

    const categories = await Category.findAll();
    let cities = [];
    try {
      let citiesData = await Event.findAll({
        attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("city")), "city"]],
        where: { is_published: true },
        order: [["city", "ASC"]],
        raw: true,
      });
      if (!citiesData || citiesData.length === 0) {
        citiesData = await Event.findAll({
          attributes: [
            [Sequelize.fn("DISTINCT", Sequelize.col("city")), "city"],
          ],
          order: [["city", "ASC"]],
          raw: true,
        });
      }
      cities = citiesData
        .map((c) => c.city || (c.dataValues && c.dataValues.city))
        .filter(Boolean);
    } catch (error) {
      console.error("Error fetching cities:", error);
      cities = ["Jakarta", "Bandung", "Surabaya", "Yogyakarta"];
    }

    res.render("events/index", {
      user: req.session.user,
      events,
      categories,
      cities,
      selectedCategory: category,
      selectedCity: city,
      searchQuery: search,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).send("Internal Server Error");
  }
});
// END EVENTS

// DETAIL
app.get("/events/:id", async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [Category, User, EventAttachment],
    });
    if (!event) {
      return res.status(404).send("Event not found");
    }
    res.render("events/detail", {
      user: req.session.user,
      event,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});
// END DETAIL

// PRIVACY
app.get("/privacy", (req, res) => {
  res.render("privacy", {
    user: req.session.user,
    title: "Privacy Policy - EventHub",
  });
});
// END PRIVACY

// TERMS OF SERVICE
app.get(["/terms", "/terms-of-service"], (req, res) => {
  res.render("terms", {
    user: req.session.user,
    title: "Terms of Service - EventHub",
  });
});
// END TERMS OF SERVICE

// REGISTER
app.get("/register", (req, res) => {
  res.render("auth/register", {
    user: req.session.user,
    error: [],
  });
});
// END REGISTER

// LGOIN
app.get("/login", (req, res) => {
  res.render("auth/login", {
    user: req.session.user,
    error: [],
  });
});
// END LOGIN

// END CONTROLLERS

// Sync table model
async function syncDatabase() {
  try {
    await sequelize.sync({ alter: true });
    console.log("Database synced successfully");
  } catch (err) {
    console.error("Error syncing database:", err);
  }
}

// Main server
async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");

    // sync database
    await syncDatabase();
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (err) {
    console.log("Unable to connect:", err);
  }
}

startServer();
