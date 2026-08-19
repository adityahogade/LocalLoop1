module.exports = (sequelize, DataTypes) => {
  const OrderItem = sequelize.define(
    "OrderItem",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      order_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      service_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      service_name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },

      quantity: {
        type: DataTypes.DECIMAL(6, 2),
        allowNull: false,
      },

      unit_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },

      total_price: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },

      attributes_json: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: "order_items",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
      indexes: [
        {
          fields: ["order_id"],
        },
        {
          fields: ["service_id"],
        },
      ],
    }
  );

  return OrderItem;
};