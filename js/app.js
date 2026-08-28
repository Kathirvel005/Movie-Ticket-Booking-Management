/**
 * CineWave Entertainment - Pega Movie Ticket Booking Management Application
 * Complete Interactive Application Controller
 * Designed & Developed by Kathirvel T
 */

class CineWaveApp {
    constructor() {
        this.currentView = "home";
        this.selectedMovieId = "MOV-001";
        this.selectedTheatreId = "THT-001";
        this.selectedShowId = "SHW-101";
        this.selectedSeats = [];
        this.selectedCategory = "Premium";
        this.selectedWorkbasketFilter = "All";
        this.chartInstances = {};

        this.init();
    }

    init() {
        console.log("Initializing CineWave Entertainment Pega Application... Crafted by Kathirvel T");
        this.bindEvents();
        this.renderAllViews();
        this.startSlaTimer();
    }

    // ==========================================
    // EVENT BINDINGS & VIEW NAVIGATION
    // ==========================================
    bindEvents() {
        // Close dropdowns on outside click
        window.addEventListener("click", (e) => {
            const roleMenu = document.getElementById("roleDropdownMenu");
            const roleBtn = document.getElementById("roleSwitcherBtn");
            if (roleMenu && roleBtn && !roleBtn.contains(e.target) && !roleMenu.contains(e.target)) {
                roleMenu.classList.remove("show");
            }
        });
    }

    navigateView(viewName) {
        this.currentView = viewName;
        
        // Hide all views
        document.querySelectorAll(".app-view").forEach(v => v.style.display = "none");

        // Deactivate all nav buttons
        document.querySelectorAll(".nav-item-btn").forEach(btn => {
            btn.classList.remove("active");
            if (btn.dataset.nav === viewName) btn.classList.add("active");
        });

        // Show target view
        switch (viewName) {
            case "home":
                document.getElementById("viewHome").style.display = "block";
                this.renderMoviesGrid();
                break;
            case "movies":
                document.getElementById("viewMovies").style.display = "block";
                this.renderAllMoviesGrid();
                break;
            case "theatres":
                document.getElementById("viewTheatres").style.display = "block";
                this.renderTheatresGrid();
                break;
            case "my-bookings":
                document.getElementById("viewMyBookings").style.display = "block";
                this.renderMyBookings();
                break;
            case "pega-portal":
                document.getElementById("viewPegaPortal").style.display = "block";
                this.renderPegaPortal();
                break;
            case "architecture":
                document.getElementById("viewArchitecture").style.display = "block";
                break;
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    renderAllViews() {
        this.renderHero();
        this.renderMoviesGrid();
        this.renderTheatresGrid();
        this.renderMyBookings();
        this.renderNotifications();
        this.updateHeaderBadges();
    }

    // ==========================================
    // ROLE & PERSONA MANAGEMENT (Section 24)
    // ==========================================
    toggleRoleMenu() {
        const menu = document.getElementById("roleDropdownMenu");
        menu.classList.toggle("show");
    }

    selectRole(roleName) {
        window.pegaEngine.currentUserRole = roleName;
        document.getElementById("currentRoleLabel").textContent = roleName;
        document.getElementById("currentRoleAvatar").textContent = roleName.charAt(0);
        
        // Update options
        document.querySelectorAll(".role-option").forEach(opt => {
            opt.classList.remove("selected");
            if (opt.textContent.includes(roleName)) opt.classList.add("selected");
        });

        document.getElementById("roleDropdownMenu").classList.remove("show");

        // Role-based redirect if helpful
        if (roleName === "Booking Staff" || roleName === "Cinema Manager" || roleName === "Administrator") {
            this.navigateView("pega-portal");
        } else {
            this.navigateView("home");
        }

        this.showToast(`Switched persona to: ${roleName}`, "info");
    }

    // ==========================================
    // HERO & MOVIES RENDERING (Section 2, 3, 22)
    // ==========================================
    renderHero() {
        const featured = window.pegaEngine.getMovies().find(m => m.featured) || window.pegaEngine.getMovies()[0];
        if (!featured) return;

        const banner = document.getElementById("heroBannerCard");
        if (banner && featured.backdropUrl) {
            banner.style.backgroundImage = `url('${featured.backdropUrl}')`;
        }

        document.getElementById("heroMovieTitle").textContent = featured.title;
        document.getElementById("heroRating").textContent = featured.rating;
        document.getElementById("heroCert").textContent = featured.certification;
        document.getElementById("heroDuration").textContent = featured.duration;
        document.getElementById("heroLang").textContent = featured.language;
        document.getElementById("heroGenre").textContent = featured.genre;
        document.getElementById("heroDescription").textContent = featured.description;
    }

    renderMoviesGrid(filteredList = null) {
        const movies = filteredList || window.pegaEngine.getMovies();
        const container = document.getElementById("moviesGridContainer");
        if (!container) return;

        if (movies.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-muted);">
                    <i class="fa-solid fa-film-slash" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <h3>No movies found matching the selected criteria</h3>
                    <p>Try adjusting your search query, location or language filter.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = movies.map(movie => `
            <div class="movie-card">
                <div class="movie-poster-wrap">
                    <img src="${movie.posterUrl}" alt="${movie.title}" class="movie-poster-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80'">
                    <div class="movie-poster-overlay"></div>
                    <div class="movie-badge-lang">${movie.language} • ${movie.certification}</div>
                    <div class="movie-card-rating">
                        <span class="rating-badge"><i class="fa-solid fa-star"></i> ${movie.rating}</span>
                        <span style="font-size: 0.75rem; color: #e2e8f0;">${movie.votes} votes</span>
                    </div>
                </div>
                <div class="movie-info-body">
                    <div>
                        <h3 class="movie-card-title">${movie.title}</h3>
                        <div class="movie-card-genre">${movie.genre}</div>
                        <div class="movie-card-meta-row">
                            <span><i class="fa-regular fa-clock"></i> ${movie.duration}</span>
                            <span class="movie-price-tag"><span>Starts at</span> ₹${movie.startingPrice}</span>
                        </div>
                    </div>
                    <button class="btn-book-card" onclick="app.openBookingWizard('${movie.id}')">
                        <i class="fa-solid fa-ticket"></i> BOOK TICKETS
                    </button>
                </div>
            </div>
        `).join("");
    }

    renderAllMoviesGrid() {
        const movies = window.pegaEngine.getMovies();
        const container = document.getElementById("allMoviesGrid");
        if (!container) return;

        container.innerHTML = movies.map(movie => `
            <div class="movie-card">
                <div class="movie-poster-wrap">
                    <img src="${movie.posterUrl}" alt="${movie.title}" class="movie-poster-img" loading="lazy">
                    <div class="movie-poster-overlay"></div>
                    <div class="movie-badge-lang">${movie.language} • ${movie.certification}</div>
                    <div class="movie-card-rating">
                        <span class="rating-badge"><i class="fa-solid fa-star"></i> ${movie.rating}</span>
                    </div>
                </div>
                <div class="movie-info-body">
                    <div>
                        <h3 class="movie-card-title">${movie.title}</h3>
                        <div class="movie-card-genre">${movie.genre}</div>
                        <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.75rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                            ${movie.description}
                        </p>
                        <div class="movie-card-meta-row">
                            <span><i class="fa-regular fa-clock"></i> ${movie.duration}</span>
                            <span class="movie-price-tag">₹${movie.startingPrice}</span>
                        </div>
                    </div>
                    <button class="btn-book-card" onclick="app.openBookingWizard('${movie.id}')">
                        <i class="fa-solid fa-ticket"></i> BOOK NOW
                    </button>
                </div>
            </div>
        `).join("");
    }

    filterMovies() {
        const searchQuery = (document.getElementById("movieSearchInput")?.value || "").toLowerCase().trim();
        const locationFilter = document.getElementById("filterLocation")?.value || "";
        const languageFilter = document.getElementById("filterLanguage")?.value || "";
        const genreFilter = document.getElementById("filterGenre")?.value || "";
        const showTypeFilter = document.getElementById("filterShowType")?.value || "";

        let list = window.pegaEngine.getMovies();

        if (searchQuery) {
            list = list.filter(m => 
                m.title.toLowerCase().includes(searchQuery) ||
                m.cast.toLowerCase().includes(searchQuery) ||
                m.director.toLowerCase().includes(searchQuery) ||
                m.genre.toLowerCase().includes(searchQuery)
            );
        }

        if (languageFilter) {
            list = list.filter(m => m.language === languageFilter);
        }

        if (genreFilter) {
            list = list.filter(m => m.genre.toLowerCase().includes(genreFilter.toLowerCase()));
        }

        if (locationFilter) {
            // Find movies showing in theatres of that location
            const matchingTheatres = window.pegaEngine.getTheatres().filter(t => t.location === locationFilter).map(t => t.id);
            const matchingShows = window.pegaEngine.getShows().filter(s => matchingTheatres.includes(s.theatreId)).map(s => s.movieId);
            list = list.filter(m => matchingShows.includes(m.id));
        }

        if (showTypeFilter) {
            const matchingShows = window.pegaEngine.getShows().filter(s => s.showType === showTypeFilter).map(s => s.movieId);
            list = list.filter(m => matchingShows.includes(m.id));
        }

        this.renderMoviesGrid(list);
    }

    filterByLocation(loc) {
        const locSelect = document.getElementById("filterLocation");
        if (locSelect) {
            locSelect.value = loc;
            this.navigateView("home");
            this.filterMovies();
        }
    }

    // ==========================================
    // THEATRES RENDERING (Section 4)
    // ==========================================
    renderTheatresGrid() {
        const theatres = window.pegaEngine.getTheatres();
        const container = document.getElementById("theatresGridContainer");
        if (!container) return;

        container.innerHTML = theatres.map(theatre => `
            <div class="theatre-card">
                <div class="theatre-card-header">
                    <h3 class="theatre-name">${theatre.name}</h3>
                    <span class="theatre-loc-pill">📍 ${theatre.location}</span>
                </div>
                <div class="theatre-address">
                    <i class="fa-solid fa-location-dot" style="color: var(--accent-cyan); margin-top: 3px;"></i>
                    <span>${theatre.address}</span>
                </div>
                <div class="theatre-screens-list">
                    ${theatre.screens.map(scr => `<span class="screen-badge"><i class="fa-solid fa-tv"></i> ${scr}</span>`).join("")}
                </div>
                <div class="theatre-facilities">
                    ${theatre.facilities.map(f => `<span class="facility-pill"><i class="fa-solid fa-check"></i> ${f}</span>`).join("")}
                </div>
            </div>
        `).join("");
    }

    // ==========================================
    // BOOKING WIZARD (US-001, US-002, US-003, US-004, US-007, US-008)
    // ==========================================
    openBookingWizard(movieId = "MOV-001") {
        this.selectedMovieId = movieId;
        this.selectedSeats = [];
        const movie = window.pegaEngine.getMovieById(movieId);

        document.getElementById("wizardStep1").style.display = "block";
        document.getElementById("wizardStep2Success").style.display = "none";
        document.getElementById("customerConfirmationCheck").checked = false;

        document.getElementById("wizardMovieTitle").textContent = `Book Tickets: ${movie ? movie.title : 'Cinema'}`;
        document.getElementById("wizardSubtitle").textContent = `${movie ? movie.language : ''} • ${movie ? movie.genre : ''} • Case Management Workflow`;
        document.getElementById("wizardCaseIdDisplay").textContent = "New Case Stage 0: Submit Booking Request";

        this.renderWizardStagesBar(0);
        this.populateWizardDropdowns();
        this.renderSeatMap();
        this.updateCostCalculation();

        document.getElementById("bookingWizardModal").classList.add("open");
    }

    closeBookingWizard() {
        document.getElementById("bookingWizardModal").classList.remove("open");
        this.selectedSeats = [];
    }

    renderWizardStagesBar(activeStageIndex = 0) {
        const stages = CineWaveInitialData.caseStages;
        const container = document.getElementById("wizardStagesBar");
        if (!container) return;

        const progressPercent = (activeStageIndex / (stages.length - 1)) * 100;

        container.innerHTML = `
            <div class="stage-connector">
                <div class="stage-connector-fill" style="width: ${progressPercent}%;"></div>
            </div>
            ${stages.map((stg, idx) => {
                let statusClass = "";
                if (idx < activeStageIndex) statusClass = "completed";
                else if (idx === activeStageIndex) statusClass = "active";
                return `
                    <div class="stage-node ${statusClass}">
                        <div class="stage-circle">
                            ${idx < activeStageIndex ? '<i class="fa-solid fa-check"></i>' : (idx + 1)}
                        </div>
                        <div class="stage-label">${stg.name}</div>
                    </div>
                `;
            }).join("")}
        `;
    }

    populateWizardDropdowns() {
        // Populate Movies
        const movies = window.pegaEngine.getMovies();
        const movieSelect = document.getElementById("wizardMovieSelect");
        movieSelect.innerHTML = movies.map(m => `
            <option value="${m.id}" ${m.id === this.selectedMovieId ? 'selected' : ''}>${m.title} (${m.language})</option>
        `).join("");

        // Populate Theatres
        const theatres = window.pegaEngine.getTheatres();
        const theatreSelect = document.getElementById("wizardTheatreSelect");
        theatreSelect.innerHTML = theatres.map(t => `
            <option value="${t.id}" ${t.id === this.selectedTheatreId ? 'selected' : ''}>${t.name} (${t.location})</option>
        `).join("");

        this.populateShowsDropdown();
    }

    populateShowsDropdown() {
        const shows = window.pegaEngine.getShows(this.selectedMovieId, this.selectedTheatreId);
        const showSelect = document.getElementById("wizardShowSelect");

        if (shows.length === 0) {
            showSelect.innerHTML = `<option value="">No shows available for this combination</option>`;
            this.selectedShowId = null;
            this.renderShowAvailabilityAlert(null);
            return;
        }

        showSelect.innerHTML = shows.map(s => {
            const avail = window.pegaEngine.checkShowAvailability(s.id);
            return `
                <option value="${s.id}" ${s.id === this.selectedShowId ? 'selected' : ''}>
                    ${s.date} • ${s.startTime} [${s.showType}] - ₹${s.ticketPrice} (${avail.availableSeatsCount || 0} seats left)
                </option>
            `;
        }).join("");

        this.selectedShowId = showSelect.value;
        this.renderShowAvailabilityAlert(this.selectedShowId);
    }

    onWizardMovieChanged() {
        this.selectedMovieId = document.getElementById("wizardMovieSelect").value;
        this.selectedSeats = [];
        this.populateShowsDropdown();
        this.renderSeatMap();
        this.updateCostCalculation();
    }

    onWizardTheatreChanged() {
        this.selectedTheatreId = document.getElementById("wizardTheatreSelect").value;
        this.selectedSeats = [];
        this.populateShowsDropdown();
        this.renderSeatMap();
        this.updateCostCalculation();
    }

    onWizardShowChanged() {
        this.selectedShowId = document.getElementById("wizardShowSelect").value;
        this.selectedSeats = [];
        this.renderShowAvailabilityAlert(this.selectedShowId);
        this.renderSeatMap();
        this.updateCostCalculation();
    }

    onWizardCategoryChanged() {
        this.selectedCategory = document.getElementById("wizardCategorySelect").value;
        this.updateCostCalculation();
    }

    renderShowAvailabilityAlert(showId) {
        const container = document.getElementById("wizardShowAvailabilityAlert");
        if (!container) return;

        if (!showId) {
            container.innerHTML = `
                <div style="background: rgba(230, 57, 70, 0.15); border: 1px solid var(--accent-red); padding: 0.75rem 1rem; border-radius: var(--radius-md); color: #ff8585; font-size: 0.9rem;">
                    <i class="fa-solid fa-circle-exclamation"></i> No scheduled shows currently active for this venue. Please select another theatre or movie.
                </div>
            `;
            return;
        }

        const avail = window.pegaEngine.checkShowAvailability(showId);
        if (!avail.available) {
            container.innerHTML = `
                <div style="background: rgba(230, 57, 70, 0.2); border: 1px solid var(--accent-red); padding: 0.85rem 1.25rem; border-radius: var(--radius-md); color: #ff6b6b; font-weight: 600;">
                    <i class="fa-solid fa-ban"></i> 🔴 ${avail.message}
                </div>
            `;
        } else if (avail.status === "Almost Full") {
            container.innerHTML = `
                <div style="background: rgba(255, 183, 3, 0.15); border: 1px solid var(--border-gold); padding: 0.75rem 1.25rem; border-radius: var(--radius-md); color: var(--accent-gold); font-size: 0.9rem;">
                    <i class="fa-solid fa-triangle-exclamation"></i> 🟡 Few Seats Left! (${avail.availableSeatsCount} / ${avail.totalSeats} seats available). Fast booking recommended.
                </div>
            `;
        } else {
            container.innerHTML = `
                <div style="background: rgba(6, 214, 160, 0.12); border: 1px solid var(--accent-emerald); padding: 0.75rem 1.25rem; border-radius: var(--radius-md); color: var(--accent-emerald); font-size: 0.9rem;">
                    <i class="fa-solid fa-circle-check"></i> 🟢 Available — ${avail.availableSeatsCount} seats open for booking.
                </div>
            `;
        }
    }

    renderSeatMap() {
        const container = document.getElementById("cinemaSeatsGrid");
        if (!container) return;

        const show = window.pegaEngine.getShowById(this.selectedShowId);
        const bookedSeats = show ? (show.bookedSeats || []) : [];
        const rows = ["A", "B", "C", "D", "E", "F", "G", "H"];

        let html = "";
        rows.forEach((rowLetter, rIdx) => {
            // Tier header demarcations
            if (rowLetter === "A") {
                html += `<div class="seat-tier-header">Regular Tier (Rows A–D)</div>`;
            } else if (rowLetter === "E") {
                html += `<div class="seat-tier-header" style="color: var(--accent-purple);">VIP & Premium Tier (Rows E–F)</div>`;
            } else if (rowLetter === "G") {
                html += `<div class="seat-tier-header" style="color: var(--accent-gold);">Plush Recliner Loungers (Rows G–H)</div>`;
            }

            html += `<div class="seat-row">`;
            html += `<div class="row-label">${rowLetter}</div>`;
            
            // Left Group (Cols 1, 2, 3)
            html += `<div class="seat-group aisle-right">`;
            for (let c = 1; c <= 3; c++) {
                const seatCode = `${rowLetter}${c}`;
                const isBooked = bookedSeats.includes(seatCode);
                const isSelected = this.selectedSeats.includes(seatCode);
                let tierClass = "";
                if (rIdx >= 4 && rIdx <= 5) tierClass = "vip-tier";
                if (rIdx >= 6) tierClass = "recliner-tier";

                html += `
                    <div class="cinema-seat ${isBooked ? 'booked' : ''} ${isSelected ? 'selected' : ''} ${tierClass}"
                         onclick="app.toggleSeatSelection('${seatCode}')"
                         title="${seatCode} (${isBooked ? 'Booked' : 'Available'})">
                        ${isBooked ? '✕' : seatCode}
                    </div>
                `;
            }
            html += `</div>`;

            // Right Group (Cols 4, 5, 6)
            html += `<div class="seat-group">`;
            for (let c = 4; c <= 6; c++) {
                const seatCode = `${rowLetter}${c}`;
                const isBooked = bookedSeats.includes(seatCode);
                const isSelected = this.selectedSeats.includes(seatCode);
                let tierClass = "";
                if (rIdx >= 4 && rIdx <= 5) tierClass = "vip-tier";
                if (rIdx >= 6) tierClass = "recliner-tier";

                html += `
                    <div class="cinema-seat ${isBooked ? 'booked' : ''} ${isSelected ? 'selected' : ''} ${tierClass}"
                         onclick="app.toggleSeatSelection('${seatCode}')"
                         title="${seatCode} (${isBooked ? 'Booked' : 'Available'})">
                        ${isBooked ? '✕' : seatCode}
                    </div>
                `;
            }
            html += `</div>`;

            html += `</div>`;
        });

        container.innerHTML = html;
    }

    toggleSeatSelection(seatCode) {
        const show = window.pegaEngine.getShowById(this.selectedShowId);
        if (show && show.bookedSeats && show.bookedSeats.includes(seatCode)) {
            this.showToast(`Seat ${seatCode} is already booked. Please choose another seat.`, "error");
            return;
        }

        const index = this.selectedSeats.indexOf(seatCode);
        if (index > -1) {
            this.selectedSeats.splice(index, 1);
        } else {
            if (this.selectedSeats.length >= 8) {
                this.showToast("Maximum 8 tickets allowed per booking session.", "warning");
                return;
            }
            this.selectedSeats.push(seatCode);
        }

        this.renderSeatMap();
        this.updateCostCalculation();
    }

    updateCostCalculation() {
        const cost = window.pegaEngine.calculateBookingCost(
            this.selectedShowId,
            this.selectedCategory,
            this.selectedSeats.length || 1
        );

        const qty = this.selectedSeats.length;
        document.getElementById("calcTicketQty").textContent = qty;
        document.getElementById("calcPerSeatPrice").textContent = cost.perSeatPrice;
        document.getElementById("calcTicketSubtotal").textContent = (cost.perSeatPrice * qty).toLocaleString("en-IN");
        document.getElementById("calcFeeQty").textContent = qty;
        document.getElementById("calcConvenienceFee").textContent = (qty * 40).toLocaleString("en-IN");
        
        const subtotalWithFee = (cost.perSeatPrice * qty) + (qty * 40);
        const tax = Number((subtotalWithFee * 0.18).toFixed(2));
        const total = (subtotalWithFee + tax);

        document.getElementById("calcTaxAmount").textContent = tax.toLocaleString("en-IN");
        document.getElementById("calcTotalAmount").textContent = total.toLocaleString("en-IN");

        // Lifecycle stage step 2 (Calculate Cost)
        if (this.selectedSeats.length > 0) {
            this.renderWizardStagesBar(2);
            document.getElementById("wizardCaseIdDisplay").textContent = `Stage 2: Cost Computed (₹${total.toLocaleString("en-IN")})`;
        }
    }

    proceedToBookingConfirmation() {
        const custName = document.getElementById("custNameInput")?.value || "";
        const email = document.getElementById("custEmailInput")?.value || "";
        const mobile = document.getElementById("custMobileInput")?.value || "";
        const confirmed = document.getElementById("customerConfirmationCheck")?.checked;

        if (this.selectedSeats.length === 0) {
            this.showToast("Rule US-001: Please select at least one cinema seat to proceed.", "warning");
            return;
        }

        if (!confirmed) {
            this.showToast("Rule US-004: You must check the confirmation box before proceeding.", "warning");
            return;
        }

        // Advance to Stage 4 (Confirmation) & Stage 5 (Processing)
        this.renderWizardStagesBar(4);
        document.getElementById("wizardCaseIdDisplay").textContent = "Stage 4: Customer Confirmed -> Processing...";

        try {
            const createdCase = window.pegaEngine.submitBookingCase({
                customerName: custName,
                email: email,
                mobile: mobile,
                movieId: this.selectedMovieId,
                theatreId: this.selectedTheatreId,
                showId: this.selectedShowId,
                seats: this.selectedSeats,
                ticketCategory: this.selectedCategory,
                customerConfirmed: true,
                autoApprove: true // Instant booking completion for demo
            });

            this.showBookingSuccess(createdCase);
        } catch (err) {
            this.showToast(err.message, "error");
        }
    }

    showBookingSuccess(caseItem) {
        document.getElementById("wizardStep1").style.display = "none";
        document.getElementById("wizardStep2Success").style.display = "block";

        this.renderWizardStagesBar(7); // Case Completed
        document.getElementById("wizardCaseIdDisplay").textContent = `Pega Case ${caseItem.pyID} Resolved-Completed`;

        document.getElementById("tktMovieTitle").textContent = caseItem.movieTitle;
        document.getElementById("tktTheatreName").textContent = `${caseItem.theatreName} (${caseItem.location})`;
        document.getElementById("tktDate").textContent = caseItem.showDate;
        document.getElementById("tktTime").textContent = caseItem.showTime;
        document.getElementById("tktScreen").textContent = caseItem.screenName;
        document.getElementById("tktSeats").textContent = caseItem.seats.join(" • ");
        document.getElementById("tktBookingId").textContent = caseItem.bookingId;
        document.getElementById("tktTotalAmount").textContent = `₹${caseItem.totalAmount.toLocaleString("en-IN")}`;
        document.getElementById("tktTicketIdDisplay").textContent = `Ticket ID: ${caseItem.ticketId} • Assigned: ${caseItem.assignedWorkbasket}`;

        // Generate QR Code
        const qrContainer = document.getElementById("ticketQrCanvas");
        qrContainer.innerHTML = "";
        new QRCode(qrContainer, {
            text: `CINEWAVE-VERIFIED|${caseItem.bookingId}|${caseItem.ticketId}|${caseItem.movieTitle}|${caseItem.seats.join(",")}|₹${caseItem.totalAmount}`,
            width: 128,
            height: 128,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        this.renderMyBookings();
        this.renderNotifications();
        this.updateHeaderBadges();
        this.showToast("🎉 Booking Confirmed! SMS and Email notification dispatched.", "success");
    }

    downloadTicketPdf() {
        window.print();
    }

    viewInMyBookings() {
        this.closeBookingWizard();
        this.navigateView("my-bookings");
    }

    // ==========================================
    // CUSTOMER MY BOOKINGS (Section 18)
    // ==========================================
    renderMyBookings() {
        const cases = window.pegaEngine.getCases();
        const container = document.getElementById("myBookingsContainer");
        if (!container) return;

        if (cases.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-muted);">
                    <i class="fa-solid fa-ticket-simple" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <h3>No cinema bookings yet</h3>
                    <p>Book tickets for the latest running movies to view them here.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = cases.map(c => {
            const movie = window.pegaEngine.getMovieById(c.movieId);
            let statusBadge = `<span class="sla-badge within">🟢 ${c.pyStatusWork}</span>`;
            if (c.pyStatusWork === "Pending-Review") {
                statusBadge = `<span class="sla-badge approaching">🟡 ${c.pyStatusWork}</span>`;
            } else if (c.pyStatusWork === "Resolved-Rejected" || c.pyStatusWork === "Resolved-Cancelled") {
                statusBadge = `<span class="sla-badge breached">🔴 ${c.pyStatusWork}</span>`;
            }

            return `
                <div class="booking-history-card">
                    <div class="history-card-top">
                        <img src="${movie ? movie.posterUrl : ''}" class="history-poster" alt="${c.movieTitle}">
                        <div class="history-info">
                            <h4>${c.movieTitle}</h4>
                            <div class="history-booking-id">ID: ${c.bookingId}</div>
                            <div style="font-size: 0.85rem; color: var(--accent-cyan);"><i class="fa-solid fa-masks-theater"></i> ${c.theatreName}</div>
                            <div style="font-size: 0.85rem; color: var(--text-secondary);"><i class="fa-regular fa-calendar"></i> ${c.showDate} • ${c.showTime}</div>
                            <div style="font-size: 0.85rem; color: var(--accent-gold); font-weight: 700; margin-top: 0.25rem;">Seats: ${c.seats.join(", ")}</div>
                        </div>
                    </div>
                    <div class="history-card-bottom">
                        <div>${statusBadge}</div>
                        <div style="display: flex; gap: 0.5rem;">
                            ${c.pyStatusWork === 'Resolved-Completed' ? `
                                <button class="btn-action-sm inspect" onclick="app.showCaseTicketModal('${c.pyID}')">
                                    <i class="fa-solid fa-qrcode"></i> View Ticket
                                </button>
                            ` : ''}
                            ${c.pyStatusWork !== 'Resolved-Cancelled' && c.pyStatusWork !== 'Resolved-Rejected' ? `
                                <button class="btn-action-sm reject" onclick="app.cancelBooking('${c.pyID}')">
                                    Cancel
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    }

    cancelBooking(pyID) {
        if (!confirm("Are you sure you want to cancel this booking? Held seats will be released immediately per Pega Rule 9.")) {
            return;
        }

        try {
            window.pegaEngine.cancelBookingByCustomer(pyID);
            this.renderMyBookings();
            this.renderNotifications();
            this.updateHeaderBadges();
            this.showToast("Booking cancelled. Full refund initiated & seats released.", "info");
        } catch (err) {
            this.showToast(err.message, "error");
        }
    }

    showCaseTicketModal(pyID) {
        const c = window.pegaEngine.getCaseById(pyID);
        if (!c) return;
        this.openBookingWizard(c.movieId);
        this.showBookingSuccess(c);
    }

    // ==========================================
    // PEGA PORTAL & STAFF WORKSPACE (US-005, US-006, US-009, US-010, Section 17)
    // ==========================================
    renderPegaPortal() {
        this.renderKpis();
        this.renderWorkbasketTabs();
        this.renderPegaCasesTable();
        this.renderAnalyticsCharts();
        this.renderManagerMiniData();
    }

    renderKpis() {
        const metrics = window.pegaEngine.getDashboardMetrics();
        document.getElementById("kpiTotalBookings").textContent = metrics.totalBookings;
        document.getElementById("kpiPendingRequests").textContent = metrics.pendingRequests;
        document.getElementById("kpiConfirmedBookings").textContent = metrics.confirmedBookings;
        document.getElementById("kpiCancelledBookings").textContent = metrics.cancelledBookings;
        document.getElementById("kpiSlaBreached").textContent = metrics.slaBreached;
        document.getElementById("kpiTotalRevenue").textContent = `₹${metrics.totalRevenue.toLocaleString("en-IN")}`;
    }

    renderWorkbasketTabs() {
        const workbaskets = window.pegaEngine.getWorkbaskets();
        const container = document.getElementById("workbasketTabsContainer");
        if (!container) return;

        const allCases = window.pegaEngine.getCases();
        const totalPending = allCases.filter(c => c.pyStatusWork === "Pending-Review").length;

        let html = `
            <button class="wb-tab-btn ${this.selectedWorkbasketFilter === 'All' ? 'active' : ''}" onclick="app.filterWorkbasket('All')">
                <i class="fa-solid fa-inbox"></i> All Work Queues <span class="wb-count-badge">${totalPending}</span>
            </button>
        `;

        workbaskets.forEach(wb => {
            const isActive = this.selectedWorkbasketFilter === wb.name;
            html += `
                <button class="wb-tab-btn ${isActive ? 'active' : ''}" onclick="app.filterWorkbasket('${wb.name}')">
                    <i class="fa-solid fa-users"></i> ${wb.name} <span class="wb-count-badge">${wb.count}</span>
                </button>
            `;
        });

        container.innerHTML = html;
    }

    filterWorkbasket(wbName) {
        this.selectedWorkbasketFilter = wbName;
        this.renderWorkbasketTabs();
        this.renderPegaCasesTable();
    }

    renderPegaCasesTable() {
        let cases = window.pegaEngine.getCases();
        if (this.selectedWorkbasketFilter !== "All") {
            cases = cases.filter(c => c.assignedWorkbasket === this.selectedWorkbasketFilter);
        }

        const tbody = document.getElementById("pegaCasesTableBody");
        if (!tbody) return;

        if (cases.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
                        No cases currently assigned to this work queue.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = cases.map(c => {
            let slaPill = `<span class="sla-badge within"><span class="sla-dot"></span> Within SLA</span>`;
            if (c.slaStatus === "Approaching Deadline") {
                slaPill = `<span class="sla-badge approaching"><span class="sla-dot"></span> Approaching (10m+)</span>`;
            } else if (c.slaStatus === "High Priority") {
                slaPill = `<span class="sla-badge high"><span class="sla-dot"></span> High (20m+)</span>`;
            } else if (c.slaStatus === "SLA Breached") {
                slaPill = `<span class="sla-badge breached"><span class="sla-dot"></span> Breached (30m+)</span>`;
            }

            return `
                <tr>
                    <td>
                        <strong style="color: var(--accent-gold); font-family: monospace;">${c.pyID}</strong>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${c.bookingId}</div>
                    </td>
                    <td>
                        <strong>${c.customerName}</strong>
                        <div style="font-size: 0.75rem; color: var(--text-secondary);">${c.mobile}</div>
                    </td>
                    <td>
                        <strong style="color: #fff;">${c.movieTitle}</strong>
                        <div style="font-size: 0.75rem; color: var(--accent-cyan);">${c.theatreName} (${c.screenName})</div>
                    </td>
                    <td>
                        <span class="screen-badge" style="background: rgba(0, 180, 216, 0.1); color: var(--accent-cyan); font-size: 0.75rem;">${c.showType}</span>
                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">${c.assignedWorkbasket}</div>
                    </td>
                    <td>
                        <strong>${c.seats.join(", ")}</strong>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${c.ticketCount} tickets (${c.ticketCategory})</div>
                    </td>
                    <td>
                        <strong style="color: var(--text-gold);">₹${c.totalAmount.toLocaleString("en-IN")}</strong>
                    </td>
                    <td>
                        ${slaPill}
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 3px;">Urgency: <strong>${c.urgency}</strong>/100</div>
                    </td>
                    <td>
                        <span style="font-weight: 600; color: ${c.pyStatusWork.includes('Completed') ? 'var(--accent-emerald)' : (c.pyStatusWork.includes('Rejected') ? 'var(--accent-red)' : 'var(--accent-gold)')};">
                            ${c.pyStatusWork}
                        </span>
                    </td>
                    <td>
                        <div class="action-btn-group">
                            <button class="btn-action-sm inspect" onclick="app.inspectCase('${c.pyID}')" title="Inspect Pega Case">
                                <i class="fa-solid fa-eye"></i>
                            </button>
                            ${c.pyStatusWork === 'Pending-Review' ? `
                                <button class="btn-action-sm approve" onclick="app.staffAction('${c.pyID}', 'Approve')" title="Approve Booking (US-006)">
                                    <i class="fa-solid fa-check"></i>
                                </button>
                                <button class="btn-action-sm reject" onclick="app.staffAction('${c.pyID}', 'Reject')" title="Reject Booking (US-006)">
                                    <i class="fa-solid fa-xmark"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    }

    staffAction(pyID, action) {
        let reason = "";
        if (action === "Reject") {
            reason = prompt("Pega Rule US-006: Please enter mandatory Rejection Reason for this case:");
            if (!reason) return;
        }

        try {
            window.pegaEngine.processStaffAction(pyID, action, reason, "Kathirvel T");
            this.renderPegaPortal();
            this.renderNotifications();
            this.updateHeaderBadges();
            this.showToast(`Case ${pyID} ${action}d successfully.`, "success");
        } catch (err) {
            this.showToast(err.message, "error");
        }
    }

    inspectCase(pyID) {
        const c = window.pegaEngine.getCaseById(pyID);
        if (!c) return;

        document.getElementById("inspectCaseTitle").textContent = `Case ${c.pyID} — ${c.bookingId}`;
        document.getElementById("inspectCaseSubtitle").textContent = `Pega Routing: ${c.assignedWorkbasket} | Status: ${c.pyStatusWork}`;

        const body = document.getElementById("caseInspectorBody");
        body.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
                <div class="theatre-card" style="padding: 1.25rem;">
                    <h4 style="color: var(--accent-gold); margin-bottom: 0.75rem;"><i class="fa-solid fa-user"></i> Customer Information</h4>
                    <p><strong>Name:</strong> ${c.customerName}</p>
                    <p><strong>Email:</strong> ${c.email}</p>
                    <p><strong>Mobile:</strong> ${c.mobile}</p>
                    <p><strong>Customer ID:</strong> ${c.customerId}</p>
                </div>
                <div class="theatre-card" style="padding: 1.25rem;">
                    <h4 style="color: var(--accent-cyan); margin-bottom: 0.75rem;"><i class="fa-solid fa-film"></i> Show & Seating Details</h4>
                    <p><strong>Movie:</strong> ${c.movieTitle}</p>
                    <p><strong>Venue:</strong> ${c.theatreName} (${c.location})</p>
                    <p><strong>Screen:</strong> ${c.screenName} [${c.showType}]</p>
                    <p><strong>Show Time:</strong> ${c.showDate} @ ${c.showTime}</p>
                    <p><strong>Seats:</strong> ${c.seats.join(", ")} (${c.ticketCategory})</p>
                </div>
            </div>

            <div class="theatre-card" style="padding: 1.25rem; margin-bottom: 2rem;">
                <h4 style="color: var(--accent-emerald); margin-bottom: 0.75rem;"><i class="fa-solid fa-calculator"></i> Cost & Pricing Breakdown (US-003)</h4>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; text-align: center;">
                    <div style="background: var(--bg-surface); padding: 0.75rem; border-radius: var(--radius-sm);">
                        <div style="font-size: 0.75rem; color: var(--text-muted);">Base Subtotal</div>
                        <strong style="font-size: 1.1rem;">₹${c.subtotal}</strong>
                    </div>
                    <div style="background: var(--bg-surface); padding: 0.75rem; border-radius: var(--radius-sm);">
                        <div style="font-size: 0.75rem; color: var(--text-muted);">Convenience Fee</div>
                        <strong style="font-size: 1.1rem;">₹${c.convenienceFee}</strong>
                    </div>
                    <div style="background: var(--bg-surface); padding: 0.75rem; border-radius: var(--radius-sm);">
                        <div style="font-size: 0.75rem; color: var(--text-muted);">18% GST</div>
                        <strong style="font-size: 1.1rem;">₹${c.taxAmount}</strong>
                    </div>
                    <div style="background: rgba(255, 183, 3, 0.15); padding: 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-gold);">
                        <div style="font-size: 0.75rem; color: var(--accent-gold);">Total Paid</div>
                        <strong style="font-size: 1.2rem; color: var(--accent-gold);">₹${c.totalAmount}</strong>
                    </div>
                </div>
            </div>

            <div class="theatre-card" style="padding: 1.25rem; margin-bottom: 2rem;">
                <h4 style="color: #fff; margin-bottom: 0.75rem;"><i class="fa-solid fa-clock-rotate-left"></i> Pega Case Audit Trail & History Log</h4>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${(c.auditTrail || []).map(entry => `
                        <div style="display: flex; gap: 1rem; font-size: 0.85rem; border-bottom: 1px solid var(--border-light); padding-bottom: 0.5rem;">
                            <span style="color: var(--accent-gold); min-width: 90px; font-family: monospace;">${entry.time}</span>
                            <div style="flex: 1;">
                                <strong style="color: #fff;">${entry.actor}</strong>: ${entry.action}
                                <div style="font-size: 0.75rem; color: var(--text-muted);">Lifecycle Stage: ${entry.stage}</div>
                            </div>
                        </div>
                    `).join("")}
                </div>
            </div>

            <div class="modal-footer-actions">
                ${c.pyStatusWork === 'Pending-Review' ? `
                    <button class="btn-primary" onclick="app.staffAction('${c.pyID}', 'Approve'); app.closeCaseInspector();">
                        <i class="fa-solid fa-check"></i> Approve Case
                    </button>
                    <button class="btn-secondary" style="border-color: var(--accent-red); color: var(--accent-red);" onclick="app.staffAction('${c.pyID}', 'Reject'); app.closeCaseInspector();">
                        <i class="fa-solid fa-xmark"></i> Reject Case
                    </button>
                ` : ''}
                <button class="btn-secondary" onclick="app.closeCaseInspector()">Close Inspector</button>
            </div>
        `;

        document.getElementById("caseInspectorModal").classList.add("open");
    }

    closeCaseInspector() {
        document.getElementById("caseInspectorModal").classList.remove("open");
    }

    renderAnalyticsCharts() {
        const metrics = window.pegaEngine.getDashboardMetrics();

        // Chart 1: Bookings by Movie
        const ctxMovie = document.getElementById("chartMovieBookings");
        if (ctxMovie) {
            if (this.chartInstances.movie) this.chartInstances.movie.destroy();
            const movieLabels = Object.keys(metrics.bookingsByMovie);
            const movieData = Object.values(metrics.bookingsByMovie);

            this.chartInstances.movie = new Chart(ctxMovie, {
                type: "doughnut",
                data: {
                    labels: movieLabels.map(l => l.length > 18 ? l.substring(0, 18) + '...' : l),
                    datasets: [{
                        data: movieData,
                        backgroundColor: ["#ffb703", "#fb8500", "#e63946", "#00b4d8", "#7209b7", "#06d6a0"]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: "right", labels: { color: "#94a3b8", font: { size: 11 } } }
                    }
                }
            });
        }

        // Chart 2: Revenue by Theatre
        const ctxTheatre = document.getElementById("chartTheatreRevenue");
        if (ctxTheatre) {
            if (this.chartInstances.theatre) this.chartInstances.theatre.destroy();
            const theatreLabels = Object.keys(metrics.bookingsByTheatre);
            const theatreData = Object.values(metrics.bookingsByTheatre).map(b => b * 550); // simulated revenue

            this.chartInstances.theatre = new Chart(ctxTheatre, {
                type: "bar",
                data: {
                    labels: theatreLabels.map(l => l.replace("CineWave ", "").replace("Cinemas – ", "")),
                    datasets: [{
                        label: "Revenue Generated (₹)",
                        data: theatreData,
                        backgroundColor: "#00b4d8",
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { ticks: { color: "#94a3b8", font: { size: 10 } } },
                        y: { ticks: { color: "#94a3b8" } }
                    }
                }
            });
        }
    }

    renderManagerMiniData() {
        const movies = window.pegaEngine.getMovies();
        const moviesList = document.getElementById("managerMoviesListMini");
        if (moviesList) {
            moviesList.innerHTML = movies.map(m => `
                <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-surface-elevated); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.85rem;">
                    <div><strong>${m.title}</strong> (${m.language}) - ₹${m.startingPrice}</div>
                    <button class="btn-action-sm reject" onclick="app.deleteMovieItem('${m.id}')" title="Delete Movie"><i class="fa-solid fa-trash"></i></button>
                </div>
            `).join("");
        }

        const shows = window.pegaEngine.getShows();
        const showsList = document.getElementById("managerShowsListMini");
        if (showsList) {
            showsList.innerHTML = shows.map(s => {
                const m = window.pegaEngine.getMovieById(s.movieId);
                return `
                    <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-surface-elevated); padding: 0.5rem 0.75rem; border-radius: var(--radius-sm); font-size: 0.85rem;">
                        <div>
                            <strong>${m ? m.title : s.movieId}</strong> - ${s.startTime} [${s.showType}]
                            <div style="font-size: 0.75rem; color: var(--accent-gold);">${s.status} (${(s.bookedSeats || []).length}/${s.totalSeats} booked)</div>
                        </div>
                        <div style="display: flex; gap: 0.25rem;">
                            <button class="btn-action-sm inspect" onclick="app.toggleShowSoldOut('${s.id}')" title="Toggle Sold Out">Sold Out</button>
                            <button class="btn-action-sm reject" onclick="app.deleteShowItem('${s.id}')" title="Delete Show"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </div>
                `;
            }).join("");
        }
    }

    // ==========================================
    // DATA CRUD MODALS (US-005)
    // ==========================================
    openAddMovieModal() {
        document.getElementById("addMovieModal").classList.add("open");
    }

    closeAddMovieModal() {
        document.getElementById("addMovieModal").classList.remove("open");
    }

    handleSaveMovie(e) {
        e.preventDefault();
        const title = document.getElementById("newMovieTitle").value;
        const lang = document.getElementById("newMovieLang").value;
        const genre = document.getElementById("newMovieGenre").value;
        const duration = document.getElementById("newMovieDuration").value;
        const cert = document.getElementById("newMovieCert").value;
        const price = document.getElementById("newMoviePrice").value;
        const poster = document.getElementById("newMoviePoster").value;
        const desc = document.getElementById("newMovieDesc").value;

        window.pegaEngine.addMovie({
            title, language: lang, genre, duration, certification: cert, startingPrice: price,
            posterUrl: poster || undefined, description: desc
        });

        this.closeAddMovieModal();
        this.renderAllViews();
        this.showToast(`Movie "${title}" added to catalog (US-005).`, "success");
    }

    deleteMovieItem(id) {
        if (!confirm("Are you sure you want to delete this movie record and its shows?")) return;
        window.pegaEngine.deleteMovie(id);
        this.renderAllViews();
        this.showToast("Movie deleted.", "info");
    }

    openAddShowModal() {
        const movies = window.pegaEngine.getMovies();
        const theatres = window.pegaEngine.getTheatres();

        document.getElementById("newShowMovieSelect").innerHTML = movies.map(m => `<option value="${m.id}">${m.title}</option>`).join("");
        document.getElementById("newShowTheatreSelect").innerHTML = theatres.map(t => `<option value="${t.id}">${t.name} (${t.location})</option>`).join("");

        document.getElementById("addShowModal").classList.add("open");
    }

    closeAddShowModal() {
        document.getElementById("addShowModal").classList.remove("open");
    }

    handleSaveShow(e) {
        e.preventDefault();
        const movieId = document.getElementById("newShowMovieSelect").value;
        const theatreId = document.getElementById("newShowTheatreSelect").value;
        const date = document.getElementById("newShowDate").value;
        const startTime = document.getElementById("newShowTime").value;
        const showType = document.getElementById("newShowType").value;
        const ticketPrice = document.getElementById("newShowPrice").value;

        window.pegaEngine.addShow({
            movieId, theatreId, date, startTime, showType, ticketPrice, totalSeats: 48
        });

        this.closeAddShowModal();
        this.renderAllViews();
        this.showToast("New Show scheduled and inventory provisioned (US-005).", "success");
    }

    deleteShowItem(id) {
        window.pegaEngine.deleteShow(id);
        this.renderAllViews();
        this.showToast("Show deleted.", "info");
    }

    toggleShowSoldOut(id) {
        const show = window.pegaEngine.getShowById(id);
        if (!show) return;
        const newStatus = show.status === "Sold Out" ? "Available" : "Sold Out";
        window.pegaEngine.updateShow(id, { status: newStatus });
        this.renderAllViews();
        this.showToast(`Show status updated to: ${newStatus}`, "info");
    }

    // ==========================================
    // NOTIFICATIONS & DRAWER (US-008)
    // ==========================================
    toggleNotificationDrawer() {
        const drawer = document.getElementById("notificationDrawer");
        const backdrop = document.getElementById("drawerBackdrop");
        drawer.classList.toggle("open");
        backdrop.classList.toggle("open");
    }

    renderNotifications() {
        const notifs = window.pegaEngine.getNotifications();
        const container = document.getElementById("notificationDrawerBody");
        if (!container) return;

        if (notifs.length === 0) {
            container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No new notifications</div>`;
            return;
        }

        container.innerHTML = notifs.map(n => `
            <div class="notif-item-card">
                <div class="notif-card-header">
                    <strong style="font-size: 0.9rem; color: #fff;">${n.title}</strong>
                    <span class="notif-channel-tag">${n.channel}</span>
                </div>
                <div style="font-size: 0.75rem; color: var(--accent-gold); margin-bottom: 0.35rem;">To: ${n.recipient} • ${n.time}</div>
                <p class="notif-msg">${n.message}</p>
            </div>
        `).join("");
    }

    updateHeaderBadges() {
        const cases = window.pegaEngine.getCases();
        const pending = cases.filter(c => c.pyStatusWork === "Pending-Review").length;
        const headerBadge = document.getElementById("headerPendingBadge");
        if (headerBadge) headerBadge.textContent = pending;

        const notifs = window.pegaEngine.getNotifications();
        const notifBadge = document.getElementById("notifBadgeCount");
        if (notifBadge) notifBadge.textContent = notifs.length;
    }

    // ==========================================
    // SLA TIMER ENGINE (US-009)
    // ==========================================
    startSlaTimer() {
        setInterval(() => {
            window.pegaEngine.refreshAllCaseSLAs();
            if (this.currentView === "pega-portal") {
                this.renderPegaCasesTable();
                this.renderKpis();
            }
        }, 5000);
    }

    // ==========================================
    // TOAST NOTIFICATIONS HELPER
    // ==========================================
    showToast(message, type = "info") {
        const toast = document.createElement("div");
        toast.style.position = "fixed";
        toast.style.bottom = "24px";
        toast.style.right = "24px";
        toast.style.background = type === "error" ? "var(--accent-red)" : (type === "success" ? "var(--accent-emerald)" : "var(--bg-surface-elevated)");
        toast.style.color = type === "success" ? "#000" : "#fff";
        toast.style.padding = "0.85rem 1.4rem";
        toast.style.borderRadius = "var(--radius-md)";
        toast.style.boxShadow = "var(--shadow-lg)";
        toast.style.zIndex = "9999";
        toast.style.fontSize = "0.9rem";
        toast.style.fontWeight = "600";
        toast.style.display = "flex";
        toast.style.alignItems = "center";
        toast.style.gap = "0.75rem";
        toast.style.border = "1px solid rgba(255, 255, 255, 0.2)";
        toast.style.animation = "fadeIn 0.2s ease";

        let icon = '<i class="fa-solid fa-circle-info"></i>';
        if (type === "success") icon = '<i class="fa-solid fa-circle-check"></i>';
        if (type === "error") icon = '<i class="fa-solid fa-circle-xmark"></i>';
        if (type === "warning") icon = '<i class="fa-solid fa-triangle-exclamation"></i>';

        toast.innerHTML = `${icon} <span>${message}</span>`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transition = "opacity 0.4s ease";
            setTimeout(() => toast.remove(), 400);
        }, 3800);
    }

    resetSystemData() {
        if (!confirm("Reset database back to original Pega seed state?")) return;
        window.pegaEngine.resetToDefault();
        this.renderAllViews();
        this.showToast("CineWave database successfully restored to default.", "success");
    }
}

// Global initialization
window.addEventListener("DOMContentLoaded", () => {
    window.app = new CineWaveApp();
});
