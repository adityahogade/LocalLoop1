module.exports = (sequelize, DataTypes) => {
  const ProviderAvailability = sequelize.define(
    "ProviderAvailability",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },

      provider_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },

      day_of_week: {
        type: DataTypes.TINYINT,
        allowNull: false,
      },

      start_time: {
        type: DataTypes.TIME,
        allowNull: false,
      },

      end_time: {
        type: DataTypes.TIME,
        allowNull: false,
      },

      slot_duration_minutes: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 60,
      },

      max_bookings_per_slot: {
        type: DataTypes.SMALLINT,
        allowNull: false,
        defaultValue: 1,
      },

      is_available: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: "provider_availability",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          fields: ["provider_id", "day_of_week"],
        },
      ],
    }
  );

  return ProviderAvailability;
};