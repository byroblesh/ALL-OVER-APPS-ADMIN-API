const mongoConnector = require('../../shared/mongoConnector');
const { EmailTemplateSchema } = require('../../shared/schemas');

/**
 * Templates Service
 * 
 * Servicio para gestionar templates de email de las apps.
 */
class TemplatesService {
  /**
   * Obtiene el modelo EmailTemplate para una app específica
   */
  getModel(appId) {
    return mongoConnector.getModel(appId, 'EmailTemplate', EmailTemplateSchema);
  }

  /**
   * Lista templates con filtros
   */
  async list(appId, options = {}) {
    const {
      page = 1,
      limit = 50,
      shop,
      category,
      isActive,
      search,
    } = options;

    const Template = this.getModel(appId);
    const query = {};

    if (shop) query.shop = shop;
    if (category) query.category = category;
    if (typeof isActive === 'boolean') query.isActive = isActive;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [templates, total] = await Promise.all([
      Template.find(query)
        .select('-htmlContent -textContent') // Excluir contenido pesado en listado
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Template.countDocuments(query),
    ]);

    return {
      data: templates,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtiene un template por ID (incluye contenido)
   */
  async getById(appId, templateId) {
    const Template = this.getModel(appId);
    return Template.findById(templateId).lean();
  }

  /**
   * Obtiene un template por slug y shop
   */
  async getBySlug(appId, shop, slug) {
    const Template = this.getModel(appId);
    return Template.findOne({ shop, slug }).lean();
  }

  /**
   * Crea un nuevo template
   */
  async create(appId, templateData, adminId) {
    const Template = this.getModel(appId);
    
    const template = new Template({
      ...templateData,
      lastModifiedBy: adminId,
    });

    await template.save();
    return template.toObject();
  }

  /**
   * Actualiza un template
   */
  async update(appId, templateId, updateData, adminId) {
    const Template = this.getModel(appId);
    
    // Campos protegidos
    const { _id, shop, createdAt, ...safeData } = updateData;

    return Template.findByIdAndUpdate(
      templateId,
      { 
        $set: {
          ...safeData,
          lastModifiedBy: adminId,
        }
      },
      { new: true, runValidators: true }
    ).lean();
  }

  /**
   * Activa o desactiva un template
   */
  async toggleActive(appId, templateId, isActive, adminId) {
    const Template = this.getModel(appId);
    return Template.findByIdAndUpdate(
      templateId,
      { 
        $set: { 
          isActive,
          lastModifiedBy: adminId,
        }
      },
      { new: true }
    ).lean();
  }

  /**
   * Elimina un template
   */
  async delete(appId, templateId) {
    const Template = this.getModel(appId);
    return Template.findByIdAndDelete(templateId);
  }

  /**
   * Duplica un template
   */
  async duplicate(appId, templateId, newSlug, adminId) {
    const Template = this.getModel(appId);
    
    const original = await Template.findById(templateId).lean();
    if (!original) return null;

    const { _id, createdAt, updatedAt, ...templateData } = original;

    const duplicate = new Template({
      ...templateData,
      name: `${templateData.name} (Copy)`,
      slug: newSlug || `${templateData.slug}-copy`,
      lastModifiedBy: adminId,
    });

    await duplicate.save();
    return duplicate.toObject();
  }

  /**
   * Obtiene categorías disponibles con conteo
   */
  async getCategories(appId, shop = null) {
    const Template = this.getModel(appId);
    const match = shop ? { shop } : {};

    return Template.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);
  }
}

module.exports = new TemplatesService();
