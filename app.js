require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const { Sequelize, DataTypes, Op } = require("sequelize");
const session = require("express-session");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { Xendit } = require("xendit-node");
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

const sequelize = new Sequelize(
  env.DB_NAME || "event-management",
  env.DB_USERNAME || "root",
  env.DB_PASSWORD || "",
  {
    host: env.DB_HOST || "127.0.0.1",
    port: env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false,
  },
);

// XENDIT CONFIG
const xendit = new Xendit({
  secretKey: env.XENDIT_SECRET_KEY,
});

const { Invoice } = xendit;
// END XENDIT CONFIG

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
    external_id: { type: DataTypes.STRING(255), allowNull: true },
    attendee_name: { type: DataTypes.STRING(255), allowNull: true },
    attendee_email: { type: DataTypes.STRING(255), allowNull: true },
    attendee_phone: { type: DataTypes.STRING(50), allowNull: true },
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

const XenditWebhookLog = sequelize.define(
  "XenditWebhookLog",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    webhook_id: { type: DataTypes.STRING(255) },
    event: { type: DataTypes.STRING(100) },
    invoice_id: { type: DataTypes.STRING(255) },
    external_id: { type: DataTypes.STRING(255) },
    status: { type: DataTypes.STRING(50) },
    amount: { type: DataTypes.DECIMAL(10, 2) },
    payment_method: { type: DataTypes.STRING(255) },
    payment_channel: { type: DataTypes.STRING(255) },
    currency: { type: DataTypes.STRING(10) },
    received_data: { type: DataTypes.TEXT },
    processed: { type: DataTypes.BOOLEAN, defaultValue: false },
    processing_error: { type: DataTypes.TEXT },
    headers: { type: DataTypes.TEXT },
  },
  {
    tableName: "xendit_webhook_logs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
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
app.post(
  "/events/:id/edit",
  requiredAuth,
  requiredCreator,
  upload.single("image"),
  async (req, res) => {
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
      } else if (image_path && image_path.trim() !== "") {
        finalImagePath = image_path.trim();
      }

      await event.update({
        title,
        description,
        image_path: finalImagePath,
        venue,
        event_date: event_date ? new Date(event_date) : event.event_date,
        event_end_date: event_end_date
          ? new Date(event_end_date)
          : event.event_end_date,
        max_attendees: parseInt(max_attendees) || event.max_attendees,
        price: parseFloat(price) >= 0 ? parseFloat(price) : event.price,
        available_tickets:
          parseInt(available_tickets) >= 0
            ? parseInt(available_tickets)
            : event.available_tickets,
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
  },
);
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

// PROCESS ORDER CHECKOUT & XENDIT INVOICE
async function handleOrderCheckout(req, res) {
  try {
    const {
      event_id,
      quantity,
      attendee_name,
      attendee_email,
      attendee_phone,
    } = req.body;
    const targetEventId = event_id || req.params.id;
    const qty = parseInt(quantity) || 1;

    console.log("Processing order checkout:", {
      targetEventId,
      qty,
      attendee_name,
      attendee_email,
      attendee_phone,
    });

    const event = await Event.findByPk(targetEventId, {
      include: [Category, User],
    });

    if (!event) {
      return res.status(404).send("Event not found");
    }

    if (event.available_tickets < qty) {
      return res.render("orders/checkout", {
        user: req.session.user,
        event,
        error: [
          `Not enough tickets available (only ${event.available_tickets} ticket(s) left)`,
        ],
        formData: req.body,
      });
    }

    const total_amount = parseFloat(event.price) * qty;

    // Unique external ID for Xendit invoice and order reference
    const externalId = `event-order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const currentPort = env.PORT || 3000;
    const baseUrl =
      env.BASE_URL ||
      `${req.protocol}://${req.get("host")}` ||
      `http://localhost:${currentPort}`;

    const NGROK_URL = process.env.NGROK_URL;

    const invoiceData = {
      externalId: externalId,
      amount: parseFloat(total_amount),
      description: `Order ${qty} ticket(s) for ${event.title}`,
      invoiceDuration: "86400",
      customer: {
        givenNames: attendee_name || req.session.user.name || "Customer",
        email: attendee_email || req.session.user.email,
        mobileNumber:
          attendee_phone || req.session.user.phone || "081234567890",
      },
      successRedirectUrl: `${NGROK_URL}orders/success?order_id=${externalId}`,
      failureRedirectUrl: `${NGROK_URL}orders/failed?order_id=${externalId}`,
      currency: "IDR",
      items: [
        {
          name: event.title,
          quantity: parseInt(qty),
          price: parseFloat(event.price),
          category: "Event Ticket",
        },
      ],
    };

    console.log("Creating Xendit Invoice data:", invoiceData);

    let xenditResponse = null;
    let paymentUrl = null;

    try {
      xenditResponse = await Invoice.createInvoice({
        data: invoiceData,
      });
      paymentUrl =
        xenditResponse.invoiceUrl ||
        xenditResponse.invoice_url ||
        xenditResponse.paymentUrl;
      console.log("Xendit Invoice created:", paymentUrl);
    } catch (xenditErr) {
      console.error(
        "Xendit API creation error:",
        xenditErr.message || xenditErr,
      );
      // Fallback redirect URL if Xendit API fails
      paymentUrl = `${baseUrl}/orders/success?order_id=${externalId}`;
    }

    // Create Order in DB
    const order = await Order.create({
      user_id: req.session.user.id,
      event_id: event.id,
      total_amount: total_amount,
      quantity: qty,
      attendee_name: attendee_name || req.session.user.name,
      attendee_email: attendee_email || req.session.user.email,
      attendee_phone: attendee_phone || req.session.user.phone,
      status: "pending",
      xendit_invoice_id: xenditResponse ? xenditResponse.id : externalId,
      xendit_payment_url: paymentUrl,
      xendit_expiry_date:
        xenditResponse && xenditResponse.expiryDate
          ? new Date(xenditResponse.expiryDate)
          : null,
      external_id: externalId,
    });

    // Create Ticket records for each quantity unit
    for (let i = 0; i < qty; i++) {
      const ticketCode = `TKT-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      const barcodeData = `EVENT-${event.id}-${ticketCode}-${order.id}`;

      await Ticket.create({
        order_id: order.id,
        event_id: event.id,
        ticket_code: ticketCode,
        barcode_data: barcodeData,
        attendee_name: attendee_name || req.session.user.name,
        attendee_email: attendee_email || req.session.user.email,
        attendee_phone: attendee_phone || req.session.user.phone,
      });
    }

    // Decrement available ticket count
    await event.update({
      available_tickets: event.available_tickets - qty,
    });

    // Redirect user to Xendit Staging payment page
    return res.redirect(paymentUrl);
  } catch (error) {
    console.error("Payment process error:", error);
    const targetEventId = req.body.event_id || req.params.id;
    let event = null;
    if (targetEventId) {
      event = await Event.findByPk(targetEventId, {
        include: [Category, User],
      });
    }
    return res.status(500).render("orders/checkout", {
      user: req.session.user,
      event: event,
      error: ["Failed to process transaction: " + error.message],
      formData: req.body,
    });
  }
}

// Register Order & Checkout POST endpoints
app.post("/orders", requiredAuth, handleOrderCheckout);
app.post("/events/:id/checkout", requiredAuth, handleOrderCheckout);
app.get("/payments/process/:event_id", requiredAuth, handleOrderCheckout);
app.get("/payment/process/:event_id", requiredAuth, handleOrderCheckout);
// END PROCESS ORDER CHECKOUT

// Order success page
app.get("/orders/success", requiredAuth, async (req, res) => {
  try {
    const { order_id, id } = req.query;
    const searchId = order_id || id;
    console.log("Success order id : ", searchId);

    let order = null;

    if (searchId) {
      // 1. Find by xendit_invoice_id
      order = await Order.findOne({
        where: {
          xendit_invoice_id: searchId,
        },
        include: [
          {
            model: Event,
            include: [
              Category,
              { model: User, attributes: ["id", "name", "email", "phone"] },
            ],
          },
          { model: Ticket },
        ],
      });

      // 2. Find by external_id
      if (!order) {
        console.log("Trying to find by external id");
        order = await Order.findOne({
          where: {
            external_id: searchId,
          },
          include: [
            {
              model: Event,
              include: [
                Category,
                { model: User, attributes: ["id", "name", "email", "phone"] },
              ],
            },
            {
              model: Ticket,
            },
          ],
        });
      }

      // 3. Find by primary key id if numeric
      if (!order && !isNaN(searchId)) {
        console.log("Trying to find by primary key id");
        order = await Order.findOne({
          where: {
            id: searchId,
          },
          include: [
            {
              model: Event,
              include: [
                Category,
                { model: User, attributes: ["id", "name", "email", "phone"] },
              ],
            },
            {
              model: Ticket,
            },
          ],
        });
      }
    }

    // 4. Fallback to latest order of logged-in user if no order matched searchId
    if (!order && req.session.user) {
      order = await Order.findOne({
        where: { user_id: req.session.user.id },
        order: [["created_at", "DESC"]],
        include: [
          {
            model: Event,
            include: [
              Category,
              { model: User, attributes: ["id", "name", "email", "phone"] },
            ],
          },
          {
            model: Ticket,
          },
        ],
      });
    }

    // UPDATE STATUS TO PAID IF PENDING
    if (order && order.status === "pending") {
      await order.update({
        status: "paid",
      });
      console.log("Order status updated to paid");
    }

    res.render("orders/success", {
      user: req.session.user,
      order: order,
      message: "Payment successful! Your e-ticket has been issued.",
    });
  } catch (error) {
    console.log("Success page error : ", error);
    res.status(500).render("orders/success", {
      user: req.session.user,
      order: null,
      message: null,
      error: "Failed to load order details: " + error.message,
    });
  }
});

// Order failed page
app.get("/orders/failed", requiredAuth, async (req, res) => {
  try {
    const { order_id, id } = req.query;
    const searchId = order_id || id;
    console.log("Failed order search id : ", searchId);

    let order = null;

    if (searchId) {
      // 1. Find by xendit_invoice_id
      order = await Order.findOne({
        where: {
          xendit_invoice_id: searchId,
        },
        include: [
          {
            model: Event,
            include: [
              Category,
              { model: User, attributes: ["id", "name", "email", "phone"] },
            ],
          },
          { model: Ticket },
        ],
      });

      // 2. Find by external_id
      if (!order) {
        console.log("Trying to find by external id");
        order = await Order.findOne({
          where: {
            external_id: searchId,
          },
          include: [
            {
              model: Event,
              include: [
                Category,
                { model: User, attributes: ["id", "name", "email", "phone"] },
              ],
            },
            {
              model: Ticket,
            },
          ],
        });
      }

      // 3. Find by primary key id if numeric
      if (!order && !isNaN(searchId)) {
        console.log("Trying to find by primary key id");
        order = await Order.findOne({
          where: {
            id: searchId,
          },
          include: [
            {
              model: Event,
              include: [
                Category,
                { model: User, attributes: ["id", "name", "email", "phone"] },
              ],
            },
            {
              model: Ticket,
            },
          ],
        });
      }
    }

    // 4. Fallback to latest order of logged-in user if no order matched searchId
    if (!order && req.session.user) {
      order = await Order.findOne({
        where: { user_id: req.session.user.id },
        order: [["created_at", "DESC"]],
        include: [
          {
            model: Event,
            include: [
              Category,
              { model: User, attributes: ["id", "name", "email", "phone"] },
            ],
          },
          {
            model: Ticket,
          },
        ],
      });
    }

    // UPDATE STATUS TO FAILED IF STILL PENDING
    if (order && order.status === "pending") {
      await order.update({
        status: "failed",
      });
      console.log("Order status updated to failed");
    }

    res.render("orders/failed", {
      user: req.session.user,
      order: order,
      message: "Payment transaction was not completed or failed.",
    });
  } catch (error) {
    console.log("Failed page error : ", error);
    res.status(500).render("orders/failed", {
      user: req.session.user,
      order: null,
      message: null,
      error: "Failed to load transaction details: " + error.message,
    });
  }
});

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
        {
          model: Ticket,
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

// WEBHOOKS ENDPOINT
app.get("/webhook/xendit", (req, res) => {
  res.json({
    message: "Webhook endpoint is working",
    status: "active",
    timestamp: new Date().toISOString(),
  });
});

app.post("/webhook/xendit", async (req, res) => {
  let webhookData = req.body;
  let logEntry;

  try {
    const signature = req.headers["x-callback-token"];
    const webhookId =
      req.headers["webhook-id"] ||
      req.headers["x-callback-token"] ||
      `webhook-${Date.now()}`;

    console.log("=== Xendit Webhook Received ===");
    console.log("Webhook ID: ", webhookId);
    console.log("Signature: ", signature ? "Yes" : "No");
    console.log("Webhook Event: ", webhookData.event);
    console.log("Invoice ID: ", webhookData.data?.id || webhookData.id);

    logEntry = await XenditWebhookLog.create({
      webhook_id: webhookId,
      event: webhookData.event,
      invoice_id: webhookData.data?.id || webhookData.id,
      external_id: webhookData.data?.external_id || webhookData.external_id,
      status: webhookData.data?.status || webhookData.status,
      amount: webhookData.data?.amount || webhookData.amount,
      payment_method:
        webhookData.data?.payment_method || webhookData.payment_method,
      payment_channel:
        webhookData.data?.payment_channel || webhookData.payment_channel,
      currency: webhookData.data?.currency || webhookData.currency,
      received_data: JSON.stringify(webhookData),
      headers: JSON.stringify(req.headers),
      processed: false,
    });

    console.log(`Log entry created with ID: ${logEntry.id}`);

    // PROCESS Based on Event Type
    let processingResult;
    switch (webhookData.event) {
      case "invoice.paid":
        processingResult = await handleInvoicePaid(
          webhookData.data || webhookData,
          logEntry.id,
        );
        break;

      case "invoice.expired":
        processingResult = await handleInvoiceExpired(
          webhookData.data || webhookData,
          logEntry.id,
        );
        break;

      case "invoice.failed":
        processingResult = await handleInvoiceFailed(
          webhookData.data || webhookData,
          logEntry.id,
        );
        break;

      case "payment.succeeded":
        processingResult = await handlePaymentSucceeded(
          webhookData.data || webhookData,
          logEntry.id,
        );
        break;

      case "payment.failed":
        processingResult = await handlePaymentFailed(
          webhookData.data || webhookData,
          logEntry.id,
        );
        break;

      default:
        processingResult = {
          success: true,
          message: `Event type ${webhookData.event} is not supported.`,
        };
    }

    await logEntry.update({
      processed: processingResult.success,
      processing_error: processingResult.success
        ? null
        : processingResult.message,
      status:
        processingResult.updatedStatus ||
        webhookData.data?.status ||
        webhookData.status,
    });

    console.log(`Webhook processing completed : ${processingResult.message}`);
    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
      log_id: logEntry.id,
      event: webhookData.event,
    });
  } catch (error) {
    console.error("Error processing webhook:");
    console.error("Error", error.message);

    if (logEntry) {
      await logEntry.update({
        processed: false,
        processing_error: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to process webhook",
      error: error.message,
    });
  }
});

async function handleInvoicePaid(invoiceData, logId) {
  try {
    console.log("Processing invoice paid:", invoiceData);
    if (!invoiceData || (!invoiceData.id && !invoiceData.external_id)) {
      throw new Error("Invalid invoice data");
    }

    const searchCriteria = [];
    if (invoiceData.id)
      searchCriteria.push({ xendit_invoice_id: invoiceData.id });
    if (invoiceData.external_id) {
      searchCriteria.push({ external_id: invoiceData.external_id });
      searchCriteria.push({ xendit_invoice_id: invoiceData.external_id });
    }

    const order = await Order.findOne({
      where: { [Op.or]: searchCriteria },
    });

    if (!order) {
      throw new Error(
        `Order not found for invoice ID: ${invoiceData.id || invoiceData.external_id}`,
      );
    }

    await order.update({
      status: "paid",
    });
    console.log(`Order ${order.id} updated to paid`);
    return {
      success: true,
      message: `Order ${order.id} updated to paid`,
      updatedStatus: "paid",
    };
  } catch (error) {
    console.error("Error processing invoice paid:", error.message);
    return {
      success: false,
      message: `Error processing invoice paid: ${error.message}`,
    };
  }
}

async function handleInvoiceExpired(invoiceData, logId) {
  try {
    console.log("Processing invoice expired:", invoiceData);
    if (!invoiceData || (!invoiceData.id && !invoiceData.external_id)) {
      throw new Error("Invalid invoice data");
    }

    const searchCriteria = [];
    if (invoiceData.id)
      searchCriteria.push({ xendit_invoice_id: invoiceData.id });
    if (invoiceData.external_id) {
      searchCriteria.push({ external_id: invoiceData.external_id });
      searchCriteria.push({ xendit_invoice_id: invoiceData.external_id });
    }

    const order = await Order.findOne({
      where: { [Op.or]: searchCriteria },
      include: [{ model: Event }],
    });

    if (!order) {
      throw new Error(
        `Order not found for invoice ID: ${invoiceData.id || invoiceData.external_id}`,
      );
    }

    await order.update({
      status: "expired",
    });

    if (order.Event) {
      await order.Event.update({
        available_tickets: order.Event.available_tickets + order.quantity,
      });
      console.log(`Returned ${order.quantity} tickets`);
    }

    console.log(`Order ${order.id} updated to expired`);

    return {
      success: true,
      message: `Order ${order.id} updated to expired, tickets returned`,
      updatedStatus: "expired",
    };
  } catch (error) {
    console.error("Error processing invoice expired:", error.message);
    return {
      success: false,
      message: `Error processing invoice expired: ${error.message}`,
    };
  }
}

async function handleInvoiceFailed(invoiceData, logId) {
  try {
    console.log("Processing invoice failed:", invoiceData);
    if (!invoiceData || (!invoiceData.id && !invoiceData.external_id)) {
      throw new Error("Invalid invoice data");
    }

    const searchCriteria = [];
    if (invoiceData.id)
      searchCriteria.push({ xendit_invoice_id: invoiceData.id });
    if (invoiceData.external_id) {
      searchCriteria.push({ external_id: invoiceData.external_id });
      searchCriteria.push({ xendit_invoice_id: invoiceData.external_id });
    }

    const order = await Order.findOne({
      where: { [Op.or]: searchCriteria },
      include: [{ model: Event }],
    });

    if (!order) {
      throw new Error(
        `Order not found for invoice ID: ${invoiceData.id || invoiceData.external_id}`,
      );
    }

    await order.update({
      status: "failed",
    });

    if (order.Event) {
      await order.Event.update({
        available_tickets: order.Event.available_tickets + order.quantity,
      });
      console.log(`Returned ${order.quantity} tickets`);
    }

    console.log(`Order ${order.id} updated to failed`);

    return {
      success: true,
      message: `Order ${order.id} updated to failed, tickets returned`,
      updatedStatus: "failed",
    };
  } catch (error) {
    console.error("Error processing invoice failed:", error.message);
    return {
      success: false,
      message: `Error processing invoice failed: ${error.message}`,
    };
  }
}

async function handlePaymentSucceeded(paymentData, logId) {
  try {
    console.log("Processing payment succeeded:", paymentData);
    if (!paymentData || (!paymentData.id && !paymentData.external_id)) {
      throw new Error("Invalid payment data");
    }

    const searchCriteria = [];
    if (paymentData.external_id) {
      searchCriteria.push({ external_id: paymentData.external_id });
      searchCriteria.push({ xendit_invoice_id: paymentData.external_id });
    }
    if (paymentData.id)
      searchCriteria.push({ xendit_invoice_id: paymentData.id });

    const order = await Order.findOne({
      where: { [Op.or]: searchCriteria },
    });

    if (!order) {
      console.log("Order not found");
      return {
        success: false,
        message: "Order not found",
      };
    }

    if (order.status === "pending") {
      await order.update({
        status: "paid",
      });
      console.log(`Order ${order.id} updated to paid`);
      return {
        success: true,
        message: `Order ${order.id} updated to paid`,
        updatedStatus: "paid",
      };
    }

    return {
      success: true,
      message: `Order ${order.id} is already in state ${order.status}`,
      updatedStatus: order.status,
    };
  } catch (error) {
    console.error("Error processing payment succeeded:", error.message);
    return {
      success: false,
      message: `Error processing payment succeeded: ${error.message}`,
    };
  }
}

async function handlePaymentFailed(paymentData, logId) {
  try {
    console.log("Processing payment failed:", paymentData);
    if (!paymentData || (!paymentData.id && !paymentData.external_id)) {
      throw new Error("Invalid payment data");
    }

    const searchCriteria = [];
    if (paymentData.external_id) {
      searchCriteria.push({ external_id: paymentData.external_id });
      searchCriteria.push({ xendit_invoice_id: paymentData.external_id });
    }
    if (paymentData.id)
      searchCriteria.push({ xendit_invoice_id: paymentData.id });

    const order = await Order.findOne({
      where: { [Op.or]: searchCriteria },
      include: [{ model: Event }],
    });

    if (!order) {
      console.log("Order not found");
      return {
        success: false,
        message: "Order not found",
      };
    }

    await order.update({ status: "failed" });
    if (order.Event) {
      await order.Event.update({
        available_tickets: order.Event.available_tickets + order.quantity,
      });
      console.log(`Returned ${order.quantity} tickets`);
    }
    return {
      success: true,
      message: `Order ${order.id} updated to failed`,
      updatedStatus: "failed",
    };
  } catch (error) {
    console.error("Error processing payment failed:", error.message);
    return {
      success: false,
      message: `Error processing payment failed: ${error.message}`,
    };
  }
}

// END CONTROLLERS

// Ensure database exists before Sequelize sync
async function ensureDatabaseExists() {
  const host = env.DB_HOST || "127.0.0.1";
  const port = env.DB_PORT || 3306;
  const user = env.DB_USERNAME || "root";
  const password = env.DB_PASSWORD || "";
  const databaseName = env.DB_NAME || "event-management";

  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\`;`);
  await connection.end();
}

// Clean up duplicate index keys created by previous sequelize alter: true
async function cleanupDuplicateIndexes() {
  const host = env.DB_HOST || "127.0.0.1";
  const port = env.DB_PORT || 3306;
  const user = env.DB_USERNAME || "root";
  const password = env.DB_PASSWORD || "";
  const databaseName = env.DB_NAME || "event-management";

  try {
    const connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database: databaseName,
    });

    const [rows] = await connection.query(
      `
      SELECT DISTINCT INDEX_NAME 
      FROM information_schema.STATISTICS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'user' AND INDEX_NAME != 'PRIMARY'
    `,
      [databaseName],
    );

    if (rows.length > 1) {
      // Keep first index, drop duplicate extra indexes (e.g. email_2, email_3 ... email_64)
      const indexesToDrop = rows.slice(1);
      for (const row of indexesToDrop) {
        try {
          await connection.query(
            `ALTER TABLE \`user\` DROP INDEX \`${row.INDEX_NAME}\`;`,
          );
        } catch (e) {
          // ignore drop errors if index already removed
        }
      }
      console.log(
        `Cleaned up ${indexesToDrop.length} duplicate index(es) from user table.`,
      );
    }

    await connection.end();
  } catch (err) {
    // Ignore if table does not exist yet
  }
}

// Sync table model
async function syncDatabase() {
  try {
    const colsToAdd = [
      { name: "external_id", type: "VARCHAR(255) NULL" },
      { name: "attendee_name", type: "VARCHAR(255) NULL" },
      { name: "attendee_email", type: "VARCHAR(255) NULL" },
      { name: "attendee_phone", type: "VARCHAR(50) NULL" },
    ];
    for (const col of colsToAdd) {
      try {
        await sequelize.query(
          `ALTER TABLE orders ADD COLUMN ${col.name} ${col.type};`,
        );
      } catch (colErr) {
        // Column already exists or table not created yet
      }
    }

    await sequelize.sync({ alter: true });
    console.log("Database synced successfully");
  } catch (err) {
    console.error("Error syncing database:", err);
  }
}

// Main server
async function startServer() {
  try {
    // Auto-create database if MySQL service is running
    await ensureDatabaseExists();
    await cleanupDuplicateIndexes();

    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");

    // sync database
    await syncDatabase();
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (err) {
    if (err.code === "ECONNREFUSED" || err.original?.code === "ECONNREFUSED") {
      console.error(
        "\n==================================================================",
      );
      console.error(
        " [DATABASE ERROR] Tidak dapat terhubung ke server MySQL (ECONNREFUSED).",
      );
      console.error(
        " Pastikan service MySQL (XAMPP / Laragon / MySQL Service) sudah BERJALAN!",
      );
      console.error(" Details:", err.message);
      console.error(
        "==================================================================\n",
      );
    } else {
      console.error("Unable to connect to database:", err);
    }
  }
}

startServer();
