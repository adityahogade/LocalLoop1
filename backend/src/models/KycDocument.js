module.exports = (sequelize, DataTypes) => {
  const KycDocument = sequelize.define(
    "KycDocument",
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

      document_type: {
        type: DataTypes.ENUM(
          "id_proof",
          "address_proof",
          "bank_proof",
          "business_license",
          "other"
        ),
        allowNull: false,
      },

      file_url: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected"),
        allowNull: false,
        defaultValue: "pending",
      },

      reviewed_by: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },

      reviewed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "kyc_documents",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
      indexes: [
        {
          fields: ["provider_id"],
        },
      ],
    }
  );

  return KycDocument;
};