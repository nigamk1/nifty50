/**
 * Market Hours Utility
 * Handles Indian market timing and trading session validation
 */

class MarketHours {
    constructor() {
        // Indian Stock Exchange trading hours (IST)
        this.tradingSessions = {
            EQUITY: {
                preMarket: { start: '09:00', end: '09:15' },
                regular: { start: '09:15', end: '15:30' },
                postMarket: { start: '15:40', end: '16:00' }
            },
            CURRENCY: {
                regular: { start: '09:00', end: '17:00' }
            },
            COMMODITY: {
                regular: { start: '09:00', end: '23:30' }
            }
        };

        // NSE trading holidays (2025) - Add more as needed
        this.holidays = [
            '2025-01-26', // Republic Day
            '2025-03-14', // Holi
            '2025-04-18', // Good Friday
            '2025-05-01', // Maharashtra Day
            '2025-08-15', // Independence Day
            '2025-10-02', // Gandhi Jayanti
            '2025-11-01', // Diwali Laxmi Puja
            '2025-11-04', // Diwali Balipratipada
            '2025-12-25'  // Christmas
        ];
    }

    /**
     * Get current time in IST
     */
    getCurrentISTTime() {
        const now = new Date();
        // Convert to IST (UTC+5:30)
        const istOffset = 5.5 * 60 * 60 * 1000; // 5 hours 30 minutes in milliseconds
        const istTime = new Date(now.getTime() + istOffset);
        return istTime;
    }

    /**
     * Check if current day is a trading day (Monday-Friday, excluding holidays)
     */
    isTradingDay(date = null) {
        const checkDate = date || this.getCurrentISTTime();
        const dayOfWeek = checkDate.getDay(); // 0 = Sunday, 6 = Saturday
        
        // Check if it's weekend
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            return false;
        }

        // Check if it's a holiday
        const dateString = checkDate.toISOString().split('T')[0]; // YYYY-MM-DD
        return !this.holidays.includes(dateString);
    }

    /**
     * Parse time string (HH:MM) and convert to minutes since midnight
     */
    parseTimeToMinutes(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * Get current time in minutes since midnight (IST)
     */
    getCurrentTimeInMinutes() {
        const istTime = this.getCurrentISTTime();
        return istTime.getHours() * 60 + istTime.getMinutes();
    }

    /**
     * Check if market is currently open for a specific session type
     */
    isMarketOpen(sessionType = 'EQUITY', includePreMarket = false) {
        // First check if it's a trading day
        if (!this.isTradingDay()) {
            return {
                isOpen: false,
                reason: 'Market is closed (weekend or holiday)',
                session: null,
                nextOpen: this.getNextMarketOpen()
            };
        }

        const sessions = this.tradingSessions[sessionType];
        if (!sessions) {
            return {
                isOpen: false,
                reason: 'Invalid session type',
                session: null,
                nextOpen: null
            };
        }

        const currentMinutes = this.getCurrentTimeInMinutes();
        
        // Check pre-market session
        if (includePreMarket && sessions.preMarket) {
            const preStart = this.parseTimeToMinutes(sessions.preMarket.start);
            const preEnd = this.parseTimeToMinutes(sessions.preMarket.end);
            
            if (currentMinutes >= preStart && currentMinutes < preEnd) {
                return {
                    isOpen: true,
                    reason: 'Pre-market session',
                    session: 'preMarket',
                    nextClose: this.getTimeString(preEnd)
                };
            }
        }

        // Check regular trading session
        const regularStart = this.parseTimeToMinutes(sessions.regular.start);
        const regularEnd = this.parseTimeToMinutes(sessions.regular.end);
        
        if (currentMinutes >= regularStart && currentMinutes < regularEnd) {
            return {
                isOpen: true,
                reason: 'Regular trading session',
                session: 'regular',
                nextClose: this.getTimeString(regularEnd)
            };
        }

        // Check post-market session (if applicable)
        if (sessions.postMarket) {
            const postStart = this.parseTimeToMinutes(sessions.postMarket.start);
            const postEnd = this.parseTimeToMinutes(sessions.postMarket.end);
            
            if (currentMinutes >= postStart && currentMinutes < postEnd) {
                return {
                    isOpen: true,
                    reason: 'Post-market session',
                    session: 'postMarket',
                    nextClose: this.getTimeString(postEnd)
                };
            }
        }

        // Market is closed
        return {
            isOpen: false,
            reason: 'Market is closed (outside trading hours)',
            session: null,
            nextOpen: this.getNextMarketOpen()
        };
    }

    /**
     * Convert minutes since midnight to HH:MM format
     */
    getTimeString(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    /**
     * Get next market opening time
     */
    getNextMarketOpen() {
        const istTime = this.getCurrentISTTime();
        const currentMinutes = this.getCurrentTimeInMinutes();
        const regularStart = this.parseTimeToMinutes('09:15');

        // If it's a trading day and before market open
        if (this.isTradingDay() && currentMinutes < regularStart) {
            return `Today at 09:15 IST`;
        }

        // Find next trading day
        let nextDay = new Date(istTime);
        nextDay.setDate(nextDay.getDate() + 1);
        
        while (!this.isTradingDay(nextDay)) {
            nextDay.setDate(nextDay.getDate() + 1);
        }

        const dayName = nextDay.toLocaleDateString('en-US', { weekday: 'long' });
        const dateStr = nextDay.toLocaleDateString('en-IN');
        return `${dayName}, ${dateStr} at 09:15 IST`;
    }

    /**
     * Get market status message for logging
     */
    getMarketStatusMessage() {
        const status = this.isMarketOpen('EQUITY', true);
        const istTime = this.getCurrentISTTime();
        const timeStr = istTime.toLocaleTimeString('en-IN', { 
            timeZone: 'Asia/Kolkata',
            hour12: false 
        });

        if (status.isOpen) {
            return `🟢 Market is OPEN (${status.reason}) - Current time: ${timeStr} IST - Closes at: ${status.nextClose} IST`;
        } else {
            return `🔴 Market is CLOSED (${status.reason}) - Current time: ${timeStr} IST - Next open: ${status.nextOpen}`;
        }
    }

    /**
     * Wait until market opens (for automated systems)
     */
    async waitForMarketOpen() {
        const status = this.isMarketOpen('EQUITY', true);
        
        if (status.isOpen) {
            return true;
        }

        console.log(this.getMarketStatusMessage());
        
        // Calculate wait time until market opens
        const istTime = this.getCurrentISTTime();
        const currentMinutes = this.getCurrentTimeInMinutes();
        const marketOpenMinutes = this.parseTimeToMinutes('09:15');

        let waitMinutes;
        
        if (this.isTradingDay() && currentMinutes < marketOpenMinutes) {
            // Market opens today
            waitMinutes = marketOpenMinutes - currentMinutes;
        } else {
            // Market opens next trading day
            waitMinutes = (24 * 60) - currentMinutes + marketOpenMinutes;
            
            // Add additional days if next trading day is not tomorrow
            let nextDay = new Date(istTime);
            nextDay.setDate(nextDay.getDate() + 1);
            
            while (!this.isTradingDay(nextDay)) {
                waitMinutes += 24 * 60;
                nextDay.setDate(nextDay.getDate() + 1);
            }
        }

        const waitMs = waitMinutes * 60 * 1000;
        console.log(`⏰ Waiting ${Math.round(waitMinutes)} minutes until market opens...`);
        
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(true);
            }, waitMs);
        });
    }
}

module.exports = MarketHours;
