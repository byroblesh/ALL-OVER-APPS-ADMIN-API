const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Schemas compartidos entre todas las apps
 * 
 * Estos schemas representan la estructura común de datos
 * que se administra desde el Back Office.
 */

// Schema para usuarios de las apps (no del backoffice)
const AppUserSchema = new Schema({
  shopifyCustomerId: {
    type: String,
    index: true,
  },
  shop: {
    type: String,
    required: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'blocked'],
    default: 'active',
  },
  settings: {
    type: Schema.Types.Mixed,
    default: {},
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
  collection: 'users', // Nombre de colección consistente
});

// Schema para templates de email
const EmailTemplateSchema = new Schema({
  shop: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  subject: {
    type: String,
    required: true,
  },
  htmlContent: {
    type: String,
    required: true,
  },
  textContent: {
    type: String,
  },
  variables: [{
    key: String,
    description: String,
    defaultValue: String,
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  category: {
    type: String,
    enum: ['transactional', 'marketing', 'notification', 'system'],
    default: 'transactional',
  },
  lastModifiedBy: {
    type: String, // ID del admin del backoffice
  },
}, {
  timestamps: true,
  collection: 'email_templates',
});

// Schema para métricas/analytics (lectura principalmente)
const MetricsSchema = new Schema({
  shop: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    required: true,
    index: true,
  },
  value: {
    type: Schema.Types.Mixed,
    required: true,
  },
  period: {
    start: Date,
    end: Date,
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
  collection: 'metrics',
});

// Schema para configuración por tienda
const ShopSettingsSchema = new Schema({
  shop: {
    type: String,
    required: true,
    unique: true,
  },
  appSettings: {
    type: Schema.Types.Mixed,
    default: {},
  },
  features: {
    type: Schema.Types.Mixed,
    default: {},
  },
  billing: {
    plan: String,
    status: String,
    trialEndsAt: Date,
  },
  installedAt: Date,
  lastActiveAt: Date,
}, {
  timestamps: true,
  collection: 'shop_settings',
});

module.exports = {
  AppUserSchema,
  EmailTemplateSchema,
  MetricsSchema,
  ShopSettingsSchema,
};
