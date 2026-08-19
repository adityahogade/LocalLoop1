module.exports = (sequelize, DataTypes) => {
  const Provider = sequelize.define(
    "Provider",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        unique: true,
      },

      business_name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },

      business_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      logo_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      kyc_status: {
        type: DataTypes.ENUM("pending", "approved", "rejected"),
        allowNull: false,
        defaultValue: "pending",
      },

      kyc_rejection_reason: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      average_rating: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
    },
    {
      tableName: "providers",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          fields: ["kyc_status"],
        },
      ],
    }
  );

  return Provider;
};