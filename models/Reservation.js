const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Reservation = sequelize.define('Reservation', {
    ktoBron: {
        type: DataTypes.STRING,
        allowNull: false
    },
    data: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    time: {
        type: DataTypes.TIME,
        allowNull: false
    },
    kolich: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    chatId: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    phoneNumber: { 
        type: DataTypes.STRING,
        allowNull: true 
    }
}, {
    tableName: 'Reservation',
    timestamps: false
});

module.exports = Reservation;