const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Shared schemas for all apps
 *
 * These schemas represent the common data structures
 * managed from the Back Office.
 *
 * Based on Banners All Over actual schemas.
 */

// Schema for email templates (matches real Banners All Over schema)
const EmailTemplateSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true,
  },
  language: {
    type: String,
    required: true,
    default: 'en',
    enum: ['en', 'es', 'fr', 'de', 'it', 'pt'],
    index: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  htmlTemplate: {
    type: String,
    required: true,
  },
  textTemplate: {
    type: String,
    required: true,
  },
  variables: {
    type: [String],
    default: [],
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  version: {
    type: Number,
    default: 1,
    min: 1,
  },
  shopId: {
    type: String,
    required: false,
    trim: true,
    index: true,
  },
}, {
  timestamps: true,
  collection: 'email-templates',
});

// Schema for shops (matches real Banners All Over schema)
const ShopSchema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  domain: {
    type: String,
    required: true,
    trim: true,
  },
  myshopifyDomain: {
    type: String,
    required: true,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLoginAt: {
    type: Date,
    default: Date.now,
  },
  plan: {
    type: {
      type: String,
      enum: ['basic', 'standard', 'pro', 'business', 'enterprise'],
      default: 'basic',
    },
    activatedAt: {
      type: Date,
      default: Date.now,
    },
    trialEndsAt: Date,
  },
  settings: {
    type: Schema.Types.Mixed,
    default: {},
  },
  auth: {
    type: Schema.Types.Mixed,
    default: {},
  },
  needsAuthUpdate: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  collection: 'shops',
});

// Schema for banners
const BannerSchema = new Schema({
  type: {
    type: String,
    required: true,
  },
  order_id: String,
  level: String,
  message: String,
  order_name: String,
}, {
  timestamps: true,
  collection: 'banners',
});

// Schema for metrics/analytics
const MetricsSchema = new Schema({
  shop: {
    type: String,
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
  collection: 'metricevents',
});

module.exports = {
  EmailTemplateSchema,
  ShopSchema,
  BannerSchema,
  MetricsSchema,
};
