module.exports = (sequelize, DataTypes) => {
  const Invoice = sequelize.define(
    "Invoice",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      invoice_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
      },

      customer_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      provider_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      reference_type: {
        type: DataTypes.ENUM("order", "subscription_payment"),
        allowNull: false,
      },

      reference_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      subtotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },

      discount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },

      tax: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },

      total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },

      payment_status: {
        type: DataTypes.ENUM("paid", "unpaid", "refunded"),
        allowNull: false,
      },

      pdf_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      issued_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "invoices",
      timestamps: false,
      indexes: [
        {
          fields: ["customer_id"],
        },
        {
          fields: ["provider_id"],
        },
      ],
    }
  );

  return Invoice;
};