module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define(
    "Review",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      customer_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      provider_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      order_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        unique: true,
      },

      rating: {
        type: DataTypes.TINYINT.UNSIGNED,
        allowNull: false,
      },

      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      is_visible: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: "reviews",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          fields: ["provider_id", "is_visible"],
        },
        {
          fields: ["customer_id"],
        },
      ],
    }
  );

  return Review;
};