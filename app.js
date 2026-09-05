require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const { Sequelize, DataTypes, Op } = require("sequelize");
const session = require("express-session");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const env = process.env;
const app = express();
const port = env.PORT;

// Multer File Upload Configuration
const uploadDir = path.join(__dirname, "public", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "event-" + uniqueSuffix + ext);
  },
});

const upload = multer({ storage: storage });

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

// MIDDLEWARE
const requiredAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
};

const requiredCreator = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== "creator") {
    return res.redirect("/");
  }
  next();
};
// END MIDDLEWARE

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
    const message = req.session.message || req.query.message || null;
    if (req.session.message) {
      delete req.session.message;
    }
    res.render("home", {
      user: req.session.user,
      message,
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

    const message = req.session.message || null;
    const error = req.session.error || null;
    delete req.session.message;
    delete req.session.error;

    res.render("events/index", {
      user: req.session.user,
      events,
      categories,
      cities,
      selectedCategory: category,
      selectedCity: city,
      searchQuery: search,
      message,
      error,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).send("Internal Server Error");
  }
});

// CREATE EVENT PAGE (GET)
app.get("/events/create", requiredAuth, requiredCreator, async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.render("events/create", {
      user: req.session.user,
      categories,
      error: [],
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});
// END CREATE EVENT

// MY EVENT
app.get("/my-event", requiredAuth, requiredCreator, async (req, res) => {
  try {
    const events = await Event.findAll({
      where: { creator_id: req.session.user.id },
      include: [Category],
      order: [["created_at", "DESC"]],
    });
    res.render("events/my-event", {
      user: req.session.user,
      events,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});
// END MY EVENT

// LOGIC CREATE EVENT
const handleCreateEvent = async (req, res) => {
  try {
    const {
      title,
      category_id,
      description,
      event_date,
      event_end_date,
      venue,
      city,
      price,
      available_tickets,
      max_attendees,
      image_path,
    } = req.body;

    let finalImagePath = image_path || "/images/placeholder.jpg";
    if (req.file) {
      finalImagePath = "/uploads/" + req.file.filename;
    }

    const event = await Event.create({
      title,
      description,
      image_path: finalImagePath,
      venue,
      event_date: event_date ? new Date(event_date) : new Date(),
      event_end_date: event_end_date ? new Date(event_end_date) : new Date(),
      max_attendees: parseInt(max_attendees) || 100,
      price: parseFloat(price) || 0,
      available_tickets: parseInt(available_tickets) || 100,
      city,
      category_id: parseInt(category_id),
      creator_id: req.session.user.id,
      is_published: true,
    });

    req.session.message = "Event created successfully";
    res.redirect(`/events/${event.id}`);
  } catch (error) {
    console.error("Error creating event:", error);
    try {
      const categories = await Category.findAll();
      res.render("events/create", {
        user: req.session.user,
        categories,
        error: [
          "Failed to create event. Please check all required fields and try again.",
        ],
        formData: req.body,
      });
    } catch (renderErr) {
      res.status(500).send("Internal Server Error");
    }
  }
};

app.post(
  "/events/create",
  requiredAuth,
  requiredCreator,
  upload.single("image"),
  handleCreateEvent,
);
app.post(
  "/events",
  requiredAuth,
  requiredCreator,
  upload.single("image"),
  handleCreateEvent,
);
// END LOGIC CREATE EVENT

// EDIT EVENT PAGE (GET)
app.get("/events/:id/edit", requiredAuth, requiredCreator, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).send("Event not found");
    }
    if (event.creator_id !== req.session.user.id) {
      req.session.error = "You are not authorized to edit this event";
      return res.redirect("/my-events");
    }
    const categories = await Category.findAll();
    const message = req.session.message || null;
    const error = req.session.error || null;
    delete req.session.message;
    delete req.session.error;

    res.render("events/edit", {
      user: req.session.user,
      event,
      categories,
      message,
      error,
    });
  } catch (error) {
    console.error("Error fetching event for edit:", error);
    res.status(500).send("Internal Server Error");
  }
});

// LOGIC EDIT EVENT (POST)
app.post("/events/:id/edit", requiredAuth, requiredCreator, upload.single("image"), async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).send("Event not found");
    }
    if (event.creator_id !== req.session.user.id) {
      req.session.error = "You are not authorized to edit this event";
      return res.redirect("/my-events");
    }

    const {
      title,
      category_id,
      description,
      event_date,
      event_end_date,
      venue,
      city,
      price,
      available_tickets,
      max_attendees,
      image_path,
    } = req.body;

    let finalImagePath = event.image_path;
    if (req.file) {
      finalImagePath = "/uploads/" + req.file.filename;
    } else if (image_path && image_path.trim() !== '') {
      finalImagePath = image_path.trim();
    }

    await event.update({
      title,
      description,
      image_path: finalImagePath,
      venue,
      event_date: event_date ? new Date(event_date) : event.event_date,
      event_end_date: event_end_date ? new Date(event_end_date) : event.event_end_date,
      max_attendees: parseInt(max_attendees) || event.max_attendees,
      price: parseFloat(price) >= 0 ? parseFloat(price) : event.price,
      available_tickets: parseInt(available_tickets) >= 0 ? parseInt(available_tickets) : event.available_tickets,
      city,
      category_id: parseInt(category_id) || event.category_id,
    });

    req.session.message = "Event updated successfully!";
    res.redirect("/my-events");
  } catch (error) {
    console.error("Error updating event:", error);
    try {
      const event = await Event.findByPk(req.params.id);
      const categories = await Category.findAll();
      res.render("events/edit", {
        user: req.session.user,
        event: Object.assign({}, event ? event.toJSON() : {}, req.body),
        categories,
        error: ["Failed to update event. Please check required fields."],
        message: null,
      });
    } catch (err) {
      res.status(500).send("Internal Server Error");
    }
  }
});
// END EDIT EVENT

// DETAIL
app.get("/events/:id", async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [Category, User, EventAttachment],
    });
    if (!event) {
      return res.status(404).send("Event not found");
    }
    const message = req.session.message || null;
    const error = req.session.error || null;
    delete req.session.message;
    delete req.session.error;

    res.render("events/detail", {
      user: req.session.user,
      event,
      message,
      error,
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
  if (req.session && req.session.user) {
    return res.redirect("/");
  }
  res.render("auth/register", {
    user: req.session ? req.session.user : undefined,
    error: [],
  });
});
// END REGISTER

// LOGIN
app.get("/login", (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect("/");
  }
  res.render("auth/login", {
    user: req.session ? req.session.user : undefined,
    error: [],
  });
});
// END LOGIN

// LOGIC REGISTER
app.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.render("auth/register", {
        user: req.session.user,
        error: ["Email already exists"],
        formData: req.body,
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: role || "user",
    });
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    req.session.message = "Registration successful";
    res.redirect("/");
  } catch (error) {
    console.log(error);
    return res.render("auth/register", {
      user: req.session.user,
      error: ["Something went wrong"],
      formData: req.body,
    });
  }
});
// END LOGIC REGISTER

// LOGIC LOGIN
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.render("auth/login", {
        user: req.session.user,
        error: ["Email not found"],
        formData: req.body,
      });
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.render("auth/login", {
        user: req.session.user,
        error: ["Invalid password"],
        formData: req.body,
      });
    }
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    req.session.message = "Login successful";
    res.redirect("/");
  } catch (error) {
    console.log(error);
    return res.render("auth/login", {
      user: req.session.user,
      error: ["Something went wrong"],
      formData: req.body,
    });
  }
});
// END LOGIC LOGIN

// LOGIC LOGOUT
const handleLogout = (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
      }
      res.clearCookie("connect.sid");
      return res.redirect("/login");
    });
  } else {
    return res.redirect("/login");
  }
};

app.get("/logout", handleLogout);
app.post("/logout", handleLogout);
// END LOGIC LOGOUT

// CHECKOUT PAGE
app.get("/events/:id/checkout", requiredAuth, async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [Category, User],
    });
    if (!event) {
      return res.status(404).send("Event not found");
    }
    res.render("orders/checkout", {
      user: req.session.user,
      event,
      error: [],
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});
// END CHECKOUT PAGE

// PROFILE
app.get("/profile", requiredAuth, async (req, res) => {
  try {
    const user = await User.findByPk(req.session.user.id);
    const order = await Order.count({
      where: { user_id: req.session.user.id },
    });
    const event = await Event.count({
      where: { creator_id: req.session.user.id },
    });
    const message = req.session.message || null;
    delete req.session.message;

    res.render("users/profile", {
      user: req.session.user,
      userData: user,
      stats: {
        orders: order,
        events: event,
      },
      message,
      error: [],
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});

// UPDATE PROFILE
app.post("/profile", requiredAuth, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    await User.update(
      { name, email, phone },
      { where: { id: req.session.user.id } },
    );
    req.session.user.name = name;
    req.session.user.email = email;
    req.session.user.phone = phone;
    req.session.message = "Profile updated successfully";
    res.redirect("/profile");
  } catch (error) {
    console.log(error);
    const user = await User.findByPk(req.session.user.id);
    const order = await Order.count({
      where: { user_id: req.session.user.id },
    });
    const event = await Event.count({
      where: { creator_id: req.session.user.id },
    });
    res.render("users/profile", {
      user: req.session.user,
      userData: user,
      stats: {
        orders: order,
        events: event,
      },
      message,
      error: ["Something went wrong"],
    });
  }
});
// END UPDATE PROFILE

// MY ORDER PAGE
app.get("/my-orders", requiredAuth, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { user_id: req.session.user.id },
      include: [
        {
          model: Event,
          include: [
            {
              model: Category,
            },
            {
              model: User,
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });
    const message = req.session.message || null;
    const error = req.session.error || null;
    delete req.session.message;
    delete req.session.error;

    res.render("orders/my-orders", {
      user: req.session.user,
      orders,
      message,
      error,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});
// END MY ORDER PAGE

// MY EVENTS PAGE (Creator Only)
app.get("/my-events", requiredAuth, requiredCreator, async (req, res) => {
  try {
    const events = await Event.findAll({
      where: { creator_id: req.session.user.id },
      include: [
        Category,
        {
          model: Order,
          required: false,
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const message = req.session.message || null;
    const error = req.session.error || null;
    delete req.session.message;
    delete req.session.error;

    res.render("events/my-events", {
      user: req.session.user,
      events,
      message,
      error,
    });
  } catch (error) {
    console.error("Error fetching my-events:", error);
    res.status(500).send("Internal Server Error");
  }
});
// END MY EVENTS PAGE

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
