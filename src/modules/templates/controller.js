const templatesService = require('./service');

/**
 * Templates Controller
 */

/**
 * GET /api/:appId/templates
 */
const list = async (request, reply) => {
  try {
    const { appId } = request;
    const { page, limit, shop, category, isActive, search } = request.query;

    const result = await templatesService.list(appId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      shop,
      category,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search,
    });

    return {
      success: true,
      ...result,
    };
  } catch (error) {
    request.log.error('Templates list error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch templates',
    });
  }
};

/**
 * GET /api/:appId/templates/:templateId
 */
const getById = async (request, reply) => {
  try {
    const { appId } = request;
    const { templateId } = request.params;

    const template = await templatesService.getById(appId, templateId);

    if (!template) {
      return reply.status(404).send({
        success: false,
        error: 'Template not found',
      });
    }

    return {
      success: true,
      data: template,
    };
  } catch (error) {
    request.log.error('Get template error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch template',
    });
  }
};

/**
 * POST /api/:appId/templates
 */
const create = async (request, reply) => {
  try {
    const { appId, userId } = request;
    const templateData = request.body;

    // Validación básica
    if (!templateData.shop || !templateData.name || !templateData.slug) {
      return reply.status(400).send({
        success: false,
        error: 'shop, name, and slug are required',
      });
    }

    const template = await templatesService.create(appId, templateData, userId);

    return reply.status(201).send({
      success: true,
      data: template,
      message: 'Template created successfully',
    });
  } catch (error) {
    request.log.error('Create template error:', error);

    if (error.code === 11000) {
      return reply.status(409).send({
        success: false,
        error: 'A template with this slug already exists for this shop',
      });
    }

    return reply.status(500).send({
      success: false,
      error: 'Failed to create template',
    });
  }
};

/**
 * PUT /api/:appId/templates/:templateId
 */
const update = async (request, reply) => {
  try {
    const { appId, userId } = request;
    const { templateId } = request.params;
    const updateData = request.body;

    const template = await templatesService.update(appId, templateId, updateData, userId);

    if (!template) {
      return reply.status(404).send({
        success: false,
        error: 'Template not found',
      });
    }

    return {
      success: true,
      data: template,
      message: 'Template updated successfully',
    };
  } catch (error) {
    request.log.error('Update template error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to update template',
    });
  }
};

/**
 * PATCH /api/:appId/templates/:templateId/toggle
 */
const toggleActive = async (request, reply) => {
  try {
    const { appId, userId } = request;
    const { templateId } = request.params;
    const { isActive } = request.body;

    if (typeof isActive !== 'boolean') {
      return reply.status(400).send({
        success: false,
        error: 'isActive must be a boolean',
      });
    }

    const template = await templatesService.toggleActive(appId, templateId, isActive, userId);

    if (!template) {
      return reply.status(404).send({
        success: false,
        error: 'Template not found',
      });
    }

    return {
      success: true,
      data: template,
      message: `Template ${isActive ? 'activated' : 'deactivated'} successfully`,
    };
  } catch (error) {
    request.log.error('Toggle template error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to toggle template',
    });
  }
};

/**
 * DELETE /api/:appId/templates/:templateId
 */
const remove = async (request, reply) => {
  try {
    const { appId } = request;
    const { templateId } = request.params;

    const result = await templatesService.delete(appId, templateId);

    if (!result) {
      return reply.status(404).send({
        success: false,
        error: 'Template not found',
      });
    }

    return {
      success: true,
      message: 'Template deleted successfully',
    };
  } catch (error) {
    request.log.error('Delete template error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to delete template',
    });
  }
};

/**
 * POST /api/:appId/templates/:templateId/duplicate
 */
const duplicate = async (request, reply) => {
  try {
    const { appId, userId } = request;
    const { templateId } = request.params;
    const { slug } = request.body;

    const template = await templatesService.duplicate(appId, templateId, slug, userId);

    if (!template) {
      return reply.status(404).send({
        success: false,
        error: 'Original template not found',
      });
    }

    return reply.status(201).send({
      success: true,
      data: template,
      message: 'Template duplicated successfully',
    });
  } catch (error) {
    request.log.error('Duplicate template error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to duplicate template',
    });
  }
};

/**
 * GET /api/:appId/templates/categories
 */
const getCategories = async (request, reply) => {
  try {
    const { appId } = request;
    const { shop } = request.query;

    const categories = await templatesService.getCategories(appId, shop);

    return {
      success: true,
      data: categories,
    };
  } catch (error) {
    request.log.error('Get categories error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to fetch categories',
    });
  }
};

module.exports = {
  list,
  getById,
  create,
  update,
  toggleActive,
  remove,
  duplicate,
  getCategories,
};
