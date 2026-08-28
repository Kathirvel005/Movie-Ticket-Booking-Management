/**
 * CineWave Entertainment - Pega Platform™ Engine
 * Case Management, Data Modeling, Business Logic, SLA & Routing
 * Designed & Developed by Kathirvel T
 */

class PegaCaseEngine {
    constructor() {
        this.STORAGE_KEY = "CINEWAVE_PEGA_DB_V6";
        this.currentUserRole = "Customer"; // Customer | Staff | Manager | Admin
        this.currentActor = "Kathirvel T";
        this.initDatabase();
    }

    initDatabase() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            try {
                this.db = JSON.parse(stored);
            } catch (e) {
                console.error("Failed to parse stored DB, resetting to initial seed.", e);
                this.db = JSON.parse(JSON.stringify(CineWaveInitialData));
                this.saveDatabase();
            }
        } else {
            this.db = JSON.parse(JSON.stringify(CineWaveInitialData));
            this.saveDatabase();
        }
    }

    saveDatabase() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.db));
    }

    resetToDefault() {
        this.db = JSON.parse(JSON.stringify(CineWaveInitialData));
        this.saveDatabase();
    }

    // ==========================================
    // DATA MODEL ACCESSORS (Section 20)
    // ==========================================
    getMovies() {
        return this.db.movies || [];
    }

    getMovieById(id) {
        return this.db.movies.find(m => m.id === id);
    }

    getTheatres() {
        return this.db.theatres || [];
    }

    getTheatreById(id) {
        return this.db.theatres.find(t => t.id === id);
    }

    getScreens() {
        return this.db.screens || [];
    }

    getScreenById(id) {
        return this.db.screens.find(s => s.id === id);
    }

    getShows(filterMovieId = null, filterTheatreId = null, filterDate = null) {
        let shows = this.db.shows || [];
        if (filterMovieId) shows = shows.filter(s => s.movieId === filterMovieId);
        if (filterTheatreId) shows = shows.filter(s => s.theatreId === filterTheatreId);
        if (filterDate) shows = shows.filter(s => s.date === filterDate);
        return shows;
    }

    getShowById(id) {
        return this.db.shows.find(s => s.id === id);
    }

    getCases() {
        this.refreshAllCaseSLAs();
        return this.db.cases || [];
    }

    getCaseById(pyID) {
        this.refreshAllCaseSLAs();
        return this.db.cases.find(c => c.pyID === pyID || c.bookingId === pyID);
    }

    getWorkbaskets() {
        const cases = this.getCases();
        return this.db.workbaskets.map(wb => {
            const count = cases.filter(c => c.assignedWorkbasket === wb.name && c.pyStatusWork === "Pending-Review").length;
            return { ...wb, count };
        });
    }

    getNotifications() {
        return this.db.notifications || [];
    }

    // ==========================================
    // US-002: CHECK SHOW AVAILABILITY
    // ==========================================
    checkShowAvailability(showId, requestedSeats = []) {
        const show = this.getShowById(showId);
        if (!show) {
            return { available: false, message: "Show not found.", status: "Not Found" };
        }

        if (show.status === "Sold Out" || show.status === "Cancelled") {
            return {
                available: false,
                message: `Sorry, this show is currently ${show.status.toLowerCase()}. Please select another show.`,
                status: show.status
            };
        }

        const booked = show.bookedSeats || [];
        const availableSeatsCount = show.totalSeats - booked.length;

        if (availableSeatsCount <= 0) {
            show.status = "Sold Out";
            this.saveDatabase();
            return {
                available: false,
                message: "Sorry, this show is currently sold out. Please select another show.",
                status: "Sold Out",
                availableSeatsCount: 0
            };
        }

        // Check if any requested seat is already booked
        if (requestedSeats.length > 0) {
            const conflicts = requestedSeats.filter(s => booked.includes(s));
            if (conflicts.length > 0) {
                return {
                    available: false,
                    message: `Selected seats (${conflicts.join(", ")}) are no longer available. Please choose different seats.`,
                    conflicts,
                    status: "Conflict"
                };
            }
        }

        let visualStatus = "Available";
        if (availableSeatsCount <= 6) {
            visualStatus = "Almost Full";
        }

        return {
            available: true,
            status: visualStatus,
            totalSeats: show.totalSeats,
            bookedSeatsCount: booked.length,
            availableSeatsCount: availableSeatsCount,
            bookedSeats: booked
        };
    }

    // ==========================================
    // US-003: CALCULATE BOOKING COST
    // ==========================================
    calculateBookingCost(showId, ticketCategory = "Regular", ticketCount = 1) {
        const show = this.getShowById(showId);
        const basePrice = show ? show.ticketPrice : 150;

        // Category Multiplier matrix
        const categoryMultipliers = {
            "Regular": 1.0,
            "Premium": 1.25,
            "Recliner": 1.4,
            "VIP": 1.5
        };

        const multiplier = categoryMultipliers[ticketCategory] || 1.0;
        const perSeatPrice = Math.round(basePrice * multiplier);
        const ticketCost = ticketCount * perSeatPrice;
        const convenienceFeePerTicket = 40; // ₹40 per ticket
        const convenienceFee = ticketCount * convenienceFeePerTicket;
        const subtotal = ticketCost;
        const taxRate = 0.18; // 18% GST standard cinema tax
        const taxAmount = Number(((subtotal + convenienceFee) * taxRate).toFixed(2));
        const totalAmount = Number((subtotal + convenienceFee + taxAmount).toFixed(2));

        return {
            basePrice,
            categoryMultiplier: multiplier,
            perSeatPrice,
            ticketCount,
            ticketCategory,
            ticketCost,
            subtotal,
            convenienceFee,
            convenienceFeePerTicket,
            taxRate: "18% GST",
            taxAmount,
            totalAmount
        };
    }

    // ==========================================
    // US-010: ROUTE BOOKING REQUEST BY SHOW TYPE
    // ==========================================
    routeBookingByShowType(showType) {
        switch ((showType || "").toUpperCase()) {
            case "IMAX":
                return {
                    team: "Premium Cinema Team",
                    workbasketId: "WB-IMAX",
                    reason: "Rule US-010: Show Type = IMAX -> Auto-routed to Premium Cinema Team"
                };
            case "VIP":
                return {
                    team: "VIP Booking Team",
                    workbasketId: "WB-VIP",
                    reason: "Rule US-010: Show Type = VIP -> Auto-routed to VIP Booking Team"
                };
            case "RECLINER":
                return {
                    team: "Premium Seating Team",
                    workbasketId: "WB-RECLINER",
                    reason: "Rule US-010: Show Type = Recliner -> Auto-routed to Premium Seating Team"
                };
            case "REGULAR":
            default:
                return {
                    team: "Standard Booking Team",
                    workbasketId: "WB-REGULAR",
                    reason: "Rule US-010: Show Type = Regular -> Auto-routed to Standard Booking Team"
                };
        }
    }

    // ==========================================
    // US-001 & US-004 & US-007: SUBMIT & PROCESS CASE
    // ==========================================
    submitBookingCase(requestPayload) {
        const {
            customerName,
            email,
            mobile,
            movieId,
            theatreId,
            showId,
            seats = [],
            ticketCategory = "Regular",
            customerConfirmed = true,
            autoApprove = false // for customer immediate simulated checkout
        } = requestPayload;

        // Validation rules
        if (!customerName || customerName.trim().length < 2) {
            throw new Error("Validation Failed: Valid Customer Name is required.");
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error("Validation Failed: Valid Email Address is required.");
        }
        if (!mobile || !/^[0-9+\s-]{8,15}$/.test(mobile)) {
            throw new Error("Validation Failed: Valid Mobile Number is required.");
        }
        if (!movieId || !theatreId || !showId) {
            throw new Error("Validation Failed: Movie, Theatre, and Show selection are mandatory.");
        }
        if (!seats || seats.length === 0) {
            throw new Error("Validation Failed: At least one seat must be selected.");
        }
        if (!customerConfirmed) {
            throw new Error("Validation Failed: Rule US-004: Customer confirmation is mandatory before booking.");
        }

        const movie = this.getMovieById(movieId);
        const theatre = this.getTheatreById(theatreId);
        const show = this.getShowById(showId);
        const screen = this.getScreenById(show ? show.screenId : null);

        if (!movie || !theatre || !show) {
            throw new Error("Referential Data Integrity Error: Invalid Movie or Theatre or Show.");
        }

        // Check Show availability & seat conflicts (US-002)
        const availability = this.checkShowAvailability(showId, seats);
        if (!availability.available) {
            throw new Error(availability.message);
        }

        // Calculate Cost (US-003)
        const cost = this.calculateBookingCost(showId, ticketCategory, seats.length);

        // Routing (US-010)
        const routing = this.routeBookingByShowType(show.showType);

        // Generate Case IDs
        const caseSeq = 1000 + (this.db.cases.length + 1);
        const pyID = `C-${caseSeq}`;
        const randomHex = Math.floor(1000 + Math.random() * 9000);
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
        const bookingId = `CW${dateStr}${randomHex}`;
        const ticketId = autoApprove ? `TKT-${Math.floor(10000 + Math.random() * 90000)}` : "";

        // Status
        const initialStatus = autoApprove ? "Resolved-Completed" : "Pending-Review";
        const currentStageIndex = autoApprove ? 7 : 3; // 3 is Review, 7 is Completed

        const now = new Date();
        const newCase = {
            pyID,
            bookingId,
            ticketId,
            customerId: `CUST-${Math.floor(100 + Math.random() * 900)}`,
            customerName: customerName.trim(),
            email: email.trim(),
            mobile: mobile.trim(),
            movieId: movie.id,
            movieTitle: movie.title,
            moviePoster: movie.posterUrl,
            theatreId: theatre.id,
            theatreName: theatre.name,
            location: theatre.location,
            screenId: screen ? screen.id : show.screenId,
            screenName: screen ? screen.name : "Screen 1",
            showId: show.id,
            showDate: show.date,
            showTime: show.startTime,
            showType: show.showType,
            ticketCategory,
            ticketCount: seats.length,
            seats: [...seats],
            ticketPrice: show.ticketPrice,
            categoryMultiplier: cost.categoryMultiplier,
            subtotal: cost.subtotal,
            convenienceFee: cost.convenienceFee,
            taxAmount: cost.taxAmount,
            totalAmount: cost.totalAmount,
            pyStatusWork: initialStatus,
            currentStageIndex,
            assignedWorkbasket: routing.team,
            routingReason: routing.reason,
            createdAt: now.toISOString(),
            slaGoalMinutes: 10,
            slaDeadlineMinutes: 30,
            urgency: 15,
            slaStatus: "Within SLA",
            rejectionReason: "",
            customerConfirmed: true,
            auditTrail: [
                {
                    time: "Just now",
                    actor: `${customerName} (Customer)`,
                    action: "US-001: Booking request submitted & case initialized",
                    stage: "Submit Booking Request"
                },
                {
                    time: "Just now",
                    actor: "Pega Engine (System)",
                    action: `US-002: Seats (${seats.join(", ")}) validated & reserved`,
                    stage: "Check Show Availability"
                },
                {
                    time: "Just now",
                    actor: "Pega Calculation Engine",
                    action: `US-003: Cost calculated. Total: ₹${cost.totalAmount.toLocaleString("en-IN")}`,
                    stage: "Calculate Booking Cost"
                },
                {
                    time: "Just now",
                    actor: `${customerName} (Customer)`,
                    action: "US-004: Customer confirmed booking breakdown",
                    stage: "Customer Confirmation"
                },
                {
                    time: "Just now",
                    actor: "Pega Routing Router",
                    action: routing.reason,
                    stage: "Route Booking Request"
                }
            ]
        };

        // If autoApprove (direct customer confirmed flow)
        if (autoApprove) {
            // Lock seats in show
            show.bookedSeats = [...(show.bookedSeats || []), ...seats];
            if (show.bookedSeats.length >= show.totalSeats) {
                show.status = "Sold Out";
            } else if (show.totalSeats - show.bookedSeats.length <= 6) {
                show.status = "Almost Full";
            }

            newCase.auditTrail.push({
                time: "Just now",
                actor: "Pega Automated Booking Worker",
                action: `US-007: Booking processed and Ticket ID ${ticketId} generated`,
                stage: "Process Ticket Booking"
            });

            // Notification (US-008)
            this.sendNotification({
                bookingId,
                movieTitle: movie.title,
                theatreName: theatre.name,
                showDate: show.date,
                showTime: show.startTime,
                screenName: screen ? screen.name : "Screen 1",
                seats: seats.join(", "),
                ticketId,
                totalAmount: cost.totalAmount,
                recipient: `${customerName} (${mobile} / ${email})`
            });

            newCase.auditTrail.push({
                time: "Just now",
                actor: "Pega Notification Engine",
                action: `US-008: SMS & Email dispatch complete with QR Ticket`,
                stage: "Notify Customer"
            });
        }

        this.db.cases.unshift(newCase);
        this.saveDatabase();

        return newCase;
    }

    // ==========================================
    // US-006: STAFF REVIEW & CASE APPROVAL / REJECTION
    // ==========================================
    processStaffAction(pyID, action, rejectionReason = "", actorName = "Staff User") {
        const caseItem = this.getCaseById(pyID);
        if (!caseItem) {
            throw new Error(`Case ${pyID} not found.`);
        }

        const show = this.getShowById(caseItem.showId);

        if (action === "Approve") {
            if (caseItem.pyStatusWork === "Resolved-Completed") {
                throw new Error("Case is already approved and resolved.");
            }

            // Verify seats are still free or re-lock
            if (show) {
                const alreadyBooked = (show.bookedSeats || []).filter(s => caseItem.seats.includes(s));
                // Add unbooked seats to booked list
                const newlyBooked = caseItem.seats.filter(s => !(show.bookedSeats || []).includes(s));
                show.bookedSeats = [...(show.bookedSeats || []), ...newlyBooked];
                if (show.bookedSeats.length >= show.totalSeats) {
                    show.status = "Sold Out";
                } else if (show.totalSeats - show.bookedSeats.length <= 6) {
                    show.status = "Almost Full";
                }
            }

            const ticketId = `TKT-${Math.floor(10000 + Math.random() * 90000)}`;
            caseItem.ticketId = ticketId;
            caseItem.pyStatusWork = "Resolved-Completed";
            caseItem.currentStageIndex = 7;
            caseItem.urgency = 20;
            caseItem.slaStatus = "Within SLA";

            caseItem.auditTrail.push({
                time: "Just now",
                actor: `${actorName} (${caseItem.assignedWorkbasket})`,
                action: `US-006 & US-007: Approved booking request. Generated Ticket ${ticketId}`,
                stage: "Process Ticket Booking"
            });

            // Send notification (US-008)
            this.sendNotification({
                bookingId: caseItem.bookingId,
                movieTitle: caseItem.movieTitle,
                theatreName: caseItem.theatreName,
                showDate: caseItem.showDate,
                showTime: caseItem.showTime,
                screenName: caseItem.screenName,
                seats: caseItem.seats.join(", "),
                ticketId,
                totalAmount: caseItem.totalAmount,
                recipient: `${caseItem.customerName} (${caseItem.mobile} / ${caseItem.email})`
            });

            caseItem.auditTrail.push({
                time: "Just now",
                actor: "Pega Notification Engine",
                action: "US-008: Dispatched confirmation alert to customer",
                stage: "Notify Customer"
            });

        } else if (action === "Reject") {
            if (!rejectionReason || rejectionReason.trim().length < 3) {
                throw new Error("Mandatory: Rejection reason is required to reject a case.");
            }

            caseItem.pyStatusWork = "Resolved-Rejected";
            caseItem.rejectionReason = rejectionReason.trim();
            caseItem.currentStageIndex = 3;

            // Release temporarily locked seats (Rule 9)
            if (show && show.bookedSeats) {
                show.bookedSeats = show.bookedSeats.filter(s => !caseItem.seats.includes(s));
                if (show.bookedSeats.length < show.totalSeats && show.status === "Sold Out") {
                    show.status = "Available";
                }
            }

            caseItem.auditTrail.push({
                time: "Just now",
                actor: `${actorName} (${caseItem.assignedWorkbasket})`,
                action: `US-006: Rejected booking. Reason: "${rejectionReason.trim()}". Seats released.`,
                stage: "Review Booking Details"
            });

            // Send rejection notification
            this.db.notifications.unshift({
                id: `NOTIF-${Date.now()}`,
                title: `Booking Request Rejected - ${caseItem.movieTitle}`,
                channel: "SMS & Email",
                time: "Just now",
                recipient: `${caseItem.mobile} | ${caseItem.email}`,
                message: `CineWave: Your booking ${caseItem.bookingId} could not be processed. Reason: ${rejectionReason}. Refund initiated.`,
                read: false
            });

        } else if (action === "Request Changes") {
            caseItem.pyStatusWork = "Open-ChangesRequested";
            caseItem.auditTrail.push({
                time: "Just now",
                actor: `${actorName} (${caseItem.assignedWorkbasket})`,
                action: `US-006: Requested changes from customer: ${rejectionReason || 'Please clarify customer contact details'}`,
                stage: "Review Booking Details"
            });
        }

        this.saveDatabase();
        return caseItem;
    }

    // Cancel Booking by Customer (Rule 9)
    cancelBookingByCustomer(pyID) {
        const caseItem = this.getCaseById(pyID);
        if (!caseItem) throw new Error("Booking not found.");

        if (caseItem.pyStatusWork === "Resolved-Cancelled") {
            throw new Error("Booking is already cancelled.");
        }

        caseItem.pyStatusWork = "Resolved-Cancelled";

        // Release seats
        const show = this.getShowById(caseItem.showId);
        if (show && show.bookedSeats) {
            show.bookedSeats = show.bookedSeats.filter(s => !caseItem.seats.includes(s));
            if (show.status === "Sold Out") show.status = "Available";
        }

        caseItem.auditTrail.push({
            time: "Just now",
            actor: `${caseItem.customerName} (Customer)`,
            action: "Rule 9: Booking cancelled by customer. Seats released back to inventory.",
            stage: "Case Cancelled"
        });

        this.db.notifications.unshift({
            id: `NOTIF-${Date.now()}`,
            title: `Booking Cancelled - ${caseItem.bookingId}`,
            channel: "SMS & In-App",
            time: "Just now",
            recipient: `${caseItem.mobile}`,
            message: `CineWave: Your booking ${caseItem.bookingId} for ${caseItem.movieTitle} has been cancelled. Full refund of ₹${caseItem.totalAmount} will be credited in 24 hrs.`,
            read: false
        });

        this.saveDatabase();
        return caseItem;
    }

    // ==========================================
    // US-008: NOTIFICATION DISPATCHER
    // ==========================================
    sendNotification(details) {
        const notification = {
            id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            title: `🎟️ Booking Confirmed: ${details.movieTitle}`,
            channel: "SMS, Email & In-App",
            time: "Just now",
            recipient: details.recipient,
            message: `CineWave Entertainment: Your movie booking is confirmed! Movie: ${details.movieTitle} | Theatre: ${details.theatreName} | Screen: ${details.screenName} | Date: ${details.showDate} | Time: ${details.showTime} | Seats: ${details.seats} | Booking ID: ${details.bookingId} | Ticket ID: ${details.ticketId} | Total Paid: ₹${details.totalAmount}`,
            bookingId: details.bookingId,
            read: false
        };

        this.db.notifications.unshift(notification);
        this.saveDatabase();
        return notification;
    }

    // ==========================================
    // US-009: SLA MONITOR & URGENCY CALCULATOR
    // ==========================================
    refreshAllCaseSLAs() {
        const now = Date.now();
        (this.db.cases || []).forEach(c => {
            if (c.pyStatusWork.startsWith("Resolved-")) return;

            const createdTime = new Date(c.createdAt).getTime();
            const elapsedMinutes = (now - createdTime) / (1000 * 60);

            if (elapsedMinutes <= 10) {
                c.slaStatus = "Within SLA";
                c.urgency = Math.min(40, Math.round(15 + (elapsedMinutes / 10) * 25));
            } else if (elapsedMinutes <= 20) {
                c.slaStatus = "Approaching Deadline";
                c.urgency = Math.min(70, Math.round(41 + ((elapsedMinutes - 10) / 10) * 29));
            } else if (elapsedMinutes <= 30) {
                c.slaStatus = "High Priority";
                c.urgency = Math.min(89, Math.round(71 + ((elapsedMinutes - 20) / 10) * 18));
            } else {
                c.slaStatus = "SLA Breached";
                c.urgency = Math.min(100, Math.round(90 + Math.min(10, (elapsedMinutes - 30))));
            }
        });
    }

    // ==========================================
    // US-005: MAINTAIN MOVIE AND SHOW DATA (CRUD)
    // ==========================================
    addMovie(movieData) {
        const id = `MOV-${String(this.db.movies.length + 1).padStart(3, '0')}`;
        const movie = {
            id,
            title: movieData.title,
            language: movieData.language || "Tamil",
            genre: movieData.genre || "Action / Drama",
            duration: movieData.duration || "2h 30m",
            certification: movieData.certification || "U/A",
            rating: Number(movieData.rating) || 8.0,
            votes: "1.0K",
            releaseDate: movieData.releaseDate || "28 Aug 2026",
            startingPrice: Number(movieData.startingPrice) || 150,
            status: movieData.status || "Now Showing",
            director: movieData.director || "Director",
            cast: movieData.cast || "Leading Actors",
            description: movieData.description || "Exciting cinema experience from CineWave.",
            posterUrl: movieData.posterUrl || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80",
            backdropUrl: movieData.backdropUrl || "https://images.unsplash.com/photo-1518173946687-a4c8a383392e?auto=format&fit=crop&w=1200&q=80",
            trailerUrl: movieData.trailerUrl || "https://www.youtube.com",
            featured: Boolean(movieData.featured)
        };

        this.db.movies.unshift(movie);
        this.saveDatabase();
        return movie;
    }

    updateMovie(id, updatedFields) {
        const movie = this.getMovieById(id);
        if (!movie) throw new Error("Movie not found.");
        Object.assign(movie, updatedFields);
        this.saveDatabase();
        return movie;
    }

    deleteMovie(id) {
        this.db.movies = this.db.movies.filter(m => m.id !== id);
        // Also clean up shows associated
        this.db.shows = this.db.shows.filter(s => s.movieId !== id);
        this.saveDatabase();
        return true;
    }

    addTheatre(theatreData) {
        const id = `THT-${String(this.db.theatres.length + 1).padStart(3, '0')}`;
        const theatre = {
            id,
            name: theatreData.name,
            location: theatreData.location,
            address: theatreData.address,
            screens: theatreData.screens || ["Screen 1 - Dolby Atmos", "Screen 2 - IMAX"],
            facilities: theatreData.facilities || ["Dolby Atmos", "Recliners", "Food Court"],
            status: "Active"
        };
        this.db.theatres.push(theatre);
        this.saveDatabase();
        return theatre;
    }

    addShow(showData) {
        const id = `SHW-${Date.now().toString().slice(-4)}`;
        const show = {
            id,
            movieId: showData.movieId,
            theatreId: showData.theatreId,
            screenId: showData.screenId || "SCR-001",
            date: showData.date,
            startTime: showData.startTime,
            endTime: showData.endTime || "TBD",
            showType: showData.showType || "Regular",
            ticketPrice: Number(showData.ticketPrice) || 180,
            totalSeats: Number(showData.totalSeats) || 48,
            bookedSeats: [],
            status: "Available"
        };
        this.db.shows.push(show);
        this.saveDatabase();
        return show;
    }

    updateShow(id, updatedFields) {
        const show = this.getShowById(id);
        if (!show) throw new Error("Show not found.");
        Object.assign(show, updatedFields);
        this.saveDatabase();
        return show;
    }

    deleteShow(id) {
        this.db.shows = this.db.shows.filter(s => s.id !== id);
        this.saveDatabase();
        return true;
    }

    // ==========================================
    // SECTION 17: KPI & REPORTING ANALYTICS
    // ==========================================
    getDashboardMetrics(filters = {}) {
        let cases = this.getCases();

        if (filters.theatreId) cases = cases.filter(c => c.theatreId === filters.theatreId);
        if (filters.movieId) cases = cases.filter(c => c.movieId === filters.movieId);
        if (filters.location) cases = cases.filter(c => c.location === filters.location);
        if (filters.showType) cases = cases.filter(c => c.showType === filters.showType);

        const totalBookings = cases.length;
        const pendingRequests = cases.filter(c => c.pyStatusWork === "Pending-Review" || c.pyStatusWork === "Open-ChangesRequested").length;
        const confirmedBookings = cases.filter(c => c.pyStatusWork === "Resolved-Completed").length;
        const cancelledBookings = cases.filter(c => c.pyStatusWork === "Resolved-Cancelled" || c.pyStatusWork === "Resolved-Rejected").length;
        const slaBreached = cases.filter(c => c.slaStatus === "SLA Breached" && !c.pyStatusWork.startsWith("Resolved-")).length;

        const totalRevenue = cases
            .filter(c => c.pyStatusWork === "Resolved-Completed")
            .reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

        // Group by Movie
        const bookingsByMovie = {};
        cases.forEach(c => {
            bookingsByMovie[c.movieTitle] = (bookingsByMovie[c.movieTitle] || 0) + 1;
        });

        // Group by Theatre
        const bookingsByTheatre = {};
        cases.forEach(c => {
            bookingsByTheatre[c.theatreName] = (bookingsByTheatre[c.theatreName] || 0) + 1;
        });

        // Group by Show Type
        const bookingsByShowType = {};
        cases.forEach(c => {
            bookingsByShowType[c.showType] = (bookingsByShowType[c.showType] || 0) + 1;
        });

        // Group by Status
        const statusDistribution = {
            "Confirmed": confirmedBookings,
            "Pending": pendingRequests,
            "Cancelled": cancelledBookings
        };

        return {
            totalBookings,
            pendingRequests,
            confirmedBookings,
            cancelledBookings,
            slaBreached,
            totalRevenue: Math.round(totalRevenue),
            bookingsByMovie,
            bookingsByTheatre,
            bookingsByShowType,
            statusDistribution
        };
    }
}

// Global instance
window.pegaEngine = new PegaCaseEngine();
