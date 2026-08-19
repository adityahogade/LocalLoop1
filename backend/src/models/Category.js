module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define(
    "Category",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },

      slug: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },

      icon_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: "categories",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return Category;
};