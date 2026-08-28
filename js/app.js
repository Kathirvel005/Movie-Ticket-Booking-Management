/**
 * CineWave Entertainment - Tamil Movie Ticket Booking Management Application
 * Complete Interactive Application Controller with August & July 2026 Sections
 * Designed & Developed by Kathirvel T
 */

class CineWaveApp {
    constructor() {
        this.currentView = "home";
        this.selectedMovieId = "MOV-001";
        this.selectedLocation = "";
        this.selectedTheatreId = "THT-001";
        this.selectedShowId = "SHW-101";
        this.selectedSeats = [];
        this.selectedCategory = "Premium";
        this.selectedWorkbasketFilter = "All";
        this.chartInstances = {};
        this.pendingOperatorRole = null;

        this.init();
    }

    init() {
        console.log("Initializing CineWave Tamil Movie Booking Platform... Designed by Kathirvel T");
        this.bindEvents();
        this.renderAllViews();
        this.startSlaTimer();
    }

    bindEvents() {
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
        document.querySelectorAll(".app-view").forEach(v => v.style.display = "none");

        document.querySelectorAll(".nav-item-btn").forEach(btn => {
            btn.classList.remove("active");
            if (btn.dataset.nav === viewName) btn.classList.add("active");
        });

        switch (viewName) {
            case "home":
                document.getElementById("viewHome").style.display = "block";
                this.renderTamilMovieSections();
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
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    scrollToSection(sectionId) {
        this.navigateView("home");
        setTimeout(() => {
            const el = document.getElementById(sectionId);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
    }

    renderAllViews() {
        this.updateNavbarVisibility();
        this.renderUserSessionPill();
        this.renderHero();
        this.renderTamilMovieSections();
        this.renderTheatresGrid();
        this.renderMyBookings();
        this.renderNotifications();
        this.updateHeaderBadges();
    }

    updateNavbarVisibility() {
        const li = document.getElementById("navPegaPortalLi");
        if (!li) return;
        const role = window.pegaEngine.currentUserRole;
        if (role === "Booking Staff" || role === "Cinema Manager" || role === "Administrator") {
            li.style.display = "block";
        } else {
            li.style.display = "none";
        }
    }

    // ==========================================
    // ROLE & PERSONA MANAGEMENT (Section 24)
    // ==========================================
    toggleRoleMenu() {
        const menu = document.getElementById("roleDropdownMenu");
        menu.classList.toggle("show");
    }

    selectRole(roleName) {
        if (roleName === "Customer") {
            window.pegaEngine.currentUserRole = roleName;
            document.getElementById("currentRoleLabel").textContent = roleName;
            document.getElementById("currentRoleAvatar").textContent = roleName.charAt(0);
            
            document.querySelectorAll(".role-option").forEach(opt => {
                opt.classList.remove("selected");
                if (opt.textContent.includes(roleName)) opt.classList.add("selected");
            });

            document.getElementById("roleDropdownMenu").classList.remove("show");
            this.navigateView("home");
            this.updateNavbarVisibility();
            this.showToast(`Switched persona to: ${roleName}`, "info");
        } else {
            document.getElementById("roleDropdownMenu").classList.remove("show");
            this.openPegaOperatorModal(roleName);
        }
    }

    // ==========================================
    // HERO SHOWCASE
    // ==========================================
    renderHero() {
        const featured = window.pegaEngine.getMovies().find(m => m.featured) || window.pegaEngine.getMovies()[0];
        if (!featured) return;

        const banner = document.getElementById("heroBannerCard");
        if (banner && featured.backdropUrl) {
            banner.style.backgroundImage = `url('${featured.backdropUrl}')`;
        }

        document.getElementById("heroTamilTitle").textContent = featured.tamilTitle || featured.title;
        document.getElementById("heroMovieTitle").textContent = featured.englishTitle || featured.title;
        document.getElementById("heroRating").textContent = featured.rating;
        document.getElementById("heroCert").textContent = featured.certification;
        document.getElementById("heroDuration").textContent = featured.duration;
        document.getElementById("heroLang").textContent = `${featured.language} (தமிழ்)`;
        document.getElementById("heroGenre").textContent = featured.genre;
        document.getElementById("heroDescription").textContent = featured.description;
    }

    // ==========================================
    // DYNAMIC TAMIL MOVIES SECTIONS
    // 1. Released This Month – August 2026
    // 2. Released Last Month – July 2026
    // ==========================================
    renderTamilMovieSections(filteredList = null) {
        let allMovies = filteredList || window.pegaEngine.getMovies();

        // Apply sorting
        const sortBy = document.getElementById("sortBySelect")?.value || "date-desc";
        if (sortBy === "rating-desc") {
            allMovies.sort((a, b) => b.rating - a.rating);
        } else if (sortBy === "title-asc") {
            allMovies.sort((a, b) => (a.tamilTitle || a.title).localeCompare(b.tamilTitle || b.title));
        }

        const augustMovies = allMovies.filter(m => m.releaseCategory === "August 2026");
        const julyMovies = allMovies.filter(m => m.releaseCategory === "July 2026");

        const augContainer = document.getElementById("augustMoviesGrid");
        const julContainer = document.getElementById("julyMoviesGrid");

        if (augContainer) {
            if (augustMovies.length === 0) {
                augContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">No August 2026 Tamil releases match the selected filter.</div>`;
            } else {
                augContainer.innerHTML = augustMovies.map(movie => this.buildMovieCardHtml(movie, "Aug 2026 Release")).join("");
            }
        }

        if (julContainer) {
            if (julyMovies.length === 0) {
                julContainer.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 2rem;">No July 2026 Tamil releases match the selected filter.</div>`;
            } else {
                julContainer.innerHTML = julyMovies.map(movie => this.buildMovieCardHtml(movie, "Jul 2026 Superhit")).join("");
            }
        }
    }

    buildMovieCardHtml(movie, categoryBadge) {
        return `
            <div class="movie-card">
                <div class="movie-poster-wrap">
                    <img src="${movie.posterUrl}" alt="${movie.englishTitle || movie.title}" class="movie-poster-img" loading="lazy">
                    <div class="movie-poster-overlay"></div>
                    <div class="movie-badge-lang">${movie.certification} • ${movie.language}</div>
                    <div style="position: absolute; top: 1rem; right: 1rem; background: rgba(255, 183, 3, 0.2); border: 1px solid var(--border-gold); color: var(--accent-gold); padding: 0.25rem 0.65rem; border-radius: var(--radius-full); font-size: 0.7rem; font-weight: 700;">
                        ${categoryBadge}
                    </div>
                    <div class="movie-card-rating">
                        <span class="rating-badge"><i class="fa-solid fa-star"></i> ${movie.rating}</span>
                        <span style="font-size: 0.75rem; color: #e2e8f0;">${movie.votes}</span>
                    </div>
                </div>
                <div class="movie-info-body">
                    <div>
                        <div style="font-size: 0.9rem; color: var(--accent-gold); font-weight: 700; margin-bottom: 2px;">${movie.tamilTitle}</div>
                        <h3 class="movie-card-title">${movie.englishTitle || movie.title}</h3>
                        <div class="movie-card-genre">${movie.genre}</div>
                        <div style="font-size: 0.8rem; color: var(--accent-cyan); margin-bottom: 0.5rem;"><i class="fa-regular fa-calendar"></i> Release: ${movie.releaseDate}</div>
                        <p style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 0.75rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4;">
                            ${movie.description}
                        </p>
                        <div class="movie-card-meta-row">
                            <span><i class="fa-regular fa-clock"></i> ${movie.duration}</span>
                            <span class="movie-price-tag"><span>Starts at</span> ₹${movie.startingPrice}</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem;">
                        <button class="btn-book-card" onclick="app.openBookingWizard('${movie.id}')" style="flex: 1.2;">
                            <i class="fa-solid fa-ticket"></i> BOOK TICKETS
                        </button>
                        <button class="btn-action-sm inspect" onclick="app.openMovieDetails('${movie.id}')" style="padding: 0.6rem 0.9rem; border-radius: var(--radius-md);" title="View Movie Details">
                            <i class="fa-solid fa-circle-info"></i> Details
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    filterMovies() {
        const searchQuery = (document.getElementById("movieSearchInput")?.value || "").toLowerCase().trim();
        const categoryFilter = document.getElementById("filterCategory")?.value || "";
        const locationFilter = document.getElementById("filterLocation")?.value || "";
        const genreFilter = document.getElementById("filterGenre")?.value || "";

        let list = window.pegaEngine.getMovies();

        if (searchQuery) {
            list = list.filter(m => 
                (m.tamilTitle && m.tamilTitle.toLowerCase().includes(searchQuery)) ||
                (m.englishTitle && m.englishTitle.toLowerCase().includes(searchQuery)) ||
                (m.title && m.title.toLowerCase().includes(searchQuery)) ||
                (m.cast && m.cast.toLowerCase().includes(searchQuery)) ||
                (m.director && m.director.toLowerCase().includes(searchQuery)) ||
                (m.genre && m.genre.toLowerCase().includes(searchQuery))
            );
        }

        if (categoryFilter) {
            list = list.filter(m => m.releaseCategory === categoryFilter);
        }

        if (genreFilter) {
            list = list.filter(m => m.genre.toLowerCase().includes(genreFilter.toLowerCase()));
        }

        if (locationFilter) {
            const matchingTheatres = window.pegaEngine.getTheatres().filter(t => t.location === locationFilter).map(t => t.id);
            const matchingShows = window.pegaEngine.getShows().filter(s => matchingTheatres.includes(s.theatreId)).map(s => s.movieId);
            list = list.filter(m => matchingShows.includes(m.id));
        }

        this.renderTamilMovieSections(list);
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
    // MOVIE DETAILS MODAL
    // ==========================================
    openMovieDetails(movieId) {
        const movie = window.pegaEngine.getMovieById(movieId);
        if (!movie) return;

        document.getElementById("detailModalTitle").textContent = `${movie.tamilTitle} (${movie.englishTitle || movie.title})`;
        document.getElementById("detailModalSubtitle").textContent = `${movie.releaseCategoryLabel || movie.releaseCategory} • ${movie.language} Cinema`;

        const body = document.getElementById("movieDetailsBody");
        body.innerHTML = `
            <div style="display: grid; grid-template-columns: 240px 1fr; gap: 1.75rem; margin-bottom: 1.5rem;">
                <div>
                    <img src="${movie.posterUrl}" alt="${movie.title}" style="width: 100%; border-radius: var(--radius-md); box-shadow: var(--shadow-md); aspect-ratio: 2/3; object-fit: cover;">
                </div>
                <div>
                    <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1rem;">
                        <span class="rating-badge" style="font-size: 0.9rem;"><i class="fa-solid fa-star"></i> ${movie.rating}/10 (${movie.votes})</span>
                        <span class="cert-badge">${movie.certification}</span>
                        <span class="screen-badge"><i class="fa-regular fa-clock"></i> ${movie.duration}</span>
                        <span class="theatre-loc-pill">📅 ${movie.releaseDate}</span>
                    </div>
                    <div style="margin-bottom: 0.75rem;">
                        <strong style="color: var(--text-gold);">Genre:</strong> <span style="color: var(--text-secondary);">${movie.genre}</span>
                    </div>
                    <div style="margin-bottom: 0.75rem;">
                        <strong style="color: var(--accent-cyan);">Director:</strong> <span style="color: #fff;">${movie.director}</span>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <strong style="color: var(--accent-emerald);">Starring:</strong> <span style="color: var(--text-secondary);">${movie.cast}</span>
                    </div>
                    <p style="font-size: 0.95rem; color: #cbd5e1; line-height: 1.6; margin-bottom: 1.5rem;">
                        ${movie.description}
                    </p>
                    <button class="btn-primary" onclick="app.closeMovieDetails(); app.openBookingWizard('${movie.id}');">
                        <i class="fa-solid fa-ticket"></i> Book Tickets for ${movie.tamilTitle}
                    </button>
                </div>
            </div>
        `;

        document.getElementById("movieDetailsModal").classList.add("open");
    }

    closeMovieDetails() {
        document.getElementById("movieDetailsModal").classList.remove("open");
    }

    // ==========================================
    // THEATRES RENDERING
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
    // 9-STEP GUIDED BOOKING WIZARD
    // Movie -> Location -> Theatre -> Date -> Show Time -> Seats -> Customer Details -> Payment -> Confirmation
    // ==========================================
    openBookingWizard(movieId = "MOV-001") {
        const loggedInUser = window.pegaEngine.getLoggedInUser();
        if (!loggedInUser) {
            this.showToast("Please login or create an account to book tickets.", "warning");
            this.openAuthModal();
            return;
        }

        this.selectedMovieId = movieId;
        this.selectedSeats = [];
        const movie = window.pegaEngine.getMovieById(movieId);

        document.getElementById("wizardStep1").style.display = "block";
        document.getElementById("wizardStep2Success").style.display = "none";
        document.getElementById("customerConfirmationCheck").checked = false;

        document.getElementById("wizardMovieTitle").textContent = `Book Tickets: ${movie ? (movie.tamilTitle + ' (' + movie.englishTitle + ')') : 'Tamil Movie'}`;
        document.getElementById("wizardSubtitle").textContent = `${movie ? movie.genre : ''} • Pega Case Management Workflow`;
        document.getElementById("wizardCaseIdDisplay").textContent = "Step 1: Selection & Availability";

        // Fill user profile inputs
        document.getElementById("custNameInput").value = loggedInUser.name;
        document.getElementById("custEmailInput").value = loggedInUser.email;
        document.getElementById("custMobileInput").value = loggedInUser.mobile;

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
        const movies = window.pegaEngine.getMovies();
        const movieSelect = document.getElementById("wizardMovieSelect");
        movieSelect.innerHTML = movies.map(m => `
            <option value="${m.id}" ${m.id === this.selectedMovieId ? 'selected' : ''}>${m.tamilTitle} - ${m.englishTitle || m.title}</option>
        `).join("");

        this.populateTheatresDropdown();
    }

    populateTheatresDropdown() {
        let theatres = window.pegaEngine.getTheatres();
        if (this.selectedLocation) {
            theatres = theatres.filter(t => t.location === this.selectedLocation);
        }

        const theatreSelect = document.getElementById("wizardTheatreSelect");
        if (theatres.length === 0) {
            theatreSelect.innerHTML = `<option value="">No theatres found in this city</option>`;
            this.selectedTheatreId = null;
        } else {
            theatreSelect.innerHTML = theatres.map((t, idx) => `
                <option value="${t.id}" ${idx === 0 ? 'selected' : ''}>${t.name} (${t.location})</option>
            `).join("");
            this.selectedTheatreId = theatreSelect.value;
        }

        this.populateShowsDropdown();
    }

    populateShowsDropdown() {
        const shows = window.pegaEngine.getShows(this.selectedMovieId, this.selectedTheatreId);
        const showSelect = document.getElementById("wizardShowSelect");

        if (shows.length === 0) {
            showSelect.innerHTML = `<option value="">No scheduled shows available for this venue</option>`;
            this.selectedShowId = null;
            this.renderShowAvailabilityAlert(null);
            return;
        }

        showSelect.innerHTML = shows.map((s, idx) => {
            const avail = window.pegaEngine.checkShowAvailability(s.id);
            return `
                <option value="${s.id}" ${idx === 0 ? 'selected' : ''}>
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

    onWizardLocationChanged() {
        this.selectedLocation = document.getElementById("wizardLocationSelect").value;
        this.selectedSeats = [];
        this.populateTheatresDropdown();
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
                    <i class="fa-solid fa-circle-exclamation"></i> No scheduled shows currently active for this venue. Please select another theatre.
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
                    <i class="fa-solid fa-triangle-exclamation"></i> 🟡 Few Seats Left! (${avail.availableSeatsCount} / ${avail.totalSeats} seats open). Fast booking recommended.
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
            if (rowLetter === "A") {
                html += `<div class="seat-tier-header">Regular Tier (Rows A–D)</div>`;
            } else if (rowLetter === "E") {
                html += `<div class="seat-tier-header" style="color: var(--accent-purple);">VIP & Premium Tier (Rows E–F)</div>`;
            } else if (rowLetter === "G") {
                html += `<div class="seat-tier-header" style="color: var(--accent-gold);">Plush Recliner Loungers (Rows G–H)</div>`;
            }

            html += `<div class="seat-row">`;
            html += `<div class="row-label">${rowLetter}</div>`;
            
            // Left Group
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

            // Right Group
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
                this.showToast("Maximum 8 tickets allowed per booking.", "warning");
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
            this.showToast("Please select at least one seat to proceed.", "warning");
            return;
        }

        if (!confirmed) {
            this.showToast("Rule US-004: You must check the confirmation box before proceeding.", "warning");
            return;
        }

        this.renderWizardStagesBar(5); // Payment & Processing
        document.getElementById("wizardCaseIdDisplay").textContent = "Step 3: Payment Processed -> Confirmed!";

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
                autoApprove: true
            });

            this.showBookingSuccess(createdCase);
        } catch (err) {
            this.showToast(err.message, "error");
        }
    }

    showBookingSuccess(caseItem) {
        document.getElementById("wizardStep1").style.display = "none";
        document.getElementById("wizardStep2Success").style.display = "block";

        this.renderWizardStagesBar(7); // Completed
        document.getElementById("wizardCaseIdDisplay").textContent = `Pega Case ${caseItem.pyID} Resolved-Completed`;

        document.getElementById("tktTamilTitle").textContent = caseItem.tamilTitle || caseItem.movieTitle;
        document.getElementById("tktMovieTitle").textContent = caseItem.movieTitle;
        document.getElementById("tktTheatreName").textContent = `${caseItem.theatreName} (${caseItem.location})`;
        document.getElementById("tktDate").textContent = caseItem.showDate;
        document.getElementById("tktTime").textContent = caseItem.showTime;
        document.getElementById("tktScreen").textContent = caseItem.screenName;
        document.getElementById("tktSeats").textContent = caseItem.seats.join(" • ");
        document.getElementById("tktBookingId").textContent = caseItem.bookingId;
        document.getElementById("tktTotalAmount").textContent = `₹${caseItem.totalAmount.toLocaleString("en-IN")}`;
        document.getElementById("tktTicketIdDisplay").textContent = `Ticket ID: ${caseItem.ticketId} • Assigned: ${caseItem.assignedWorkbasket}`;

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
                    <p>Book tickets for August 2026 or July 2026 Tamil blockbusters to view them here.</p>
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
                            <div style="font-size: 0.85rem; color: var(--accent-gold); font-weight: 700;">${c.tamilTitle || ''}</div>
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
        if (!confirm("Are you sure you want to cancel this booking? Held seats will be released immediately.")) return;
        try {
            window.pegaEngine.cancelBookingByCustomer(pyID);
            this.renderMyBookings();
            this.renderNotifications();
            this.updateHeaderBadges();
            this.showToast("Booking cancelled. Refund initiated.", "info");
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
    // PEGA PORTAL & STAFF WORKSPACE
    // ==========================================
    renderPegaPortal() {
        this.renderKpis();
        this.renderWorkbasketTabs();
        this.renderPegaCasesTable();
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
            tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-muted);">No cases assigned to this work queue.</td></tr>`;
            return;
        }

        tbody.innerHTML = cases.map(c => {
            let slaPill = `<span class="sla-badge within"><span class="sla-dot"></span> Within SLA</span>`;
            if (c.slaStatus === "Approaching Deadline") {
                slaPill = `<span class="sla-badge approaching"><span class="sla-dot"></span> Approaching</span>`;
            } else if (c.slaStatus === "SLA Breached") {
                slaPill = `<span class="sla-badge breached"><span class="sla-dot"></span> Breached</span>`;
            }

            return `
                <tr>
                    <td><strong style="color: var(--accent-gold); font-family: monospace;">${c.pyID}</strong></td>
                    <td><strong>${c.customerName}</strong><div style="font-size: 0.75rem; color: var(--text-secondary);">${c.mobile}</div></td>
                    <td><strong style="color: #fff;">${c.tamilTitle || c.movieTitle}</strong><div style="font-size: 0.75rem; color: var(--accent-cyan);">${c.theatreName}</div></td>
                    <td><span class="screen-badge" style="font-size: 0.75rem;">${c.showType}</span></td>
                    <td><strong>${c.seats.join(", ")}</strong></td>
                    <td><strong style="color: var(--text-gold);">₹${c.totalAmount.toLocaleString("en-IN")}</strong></td>
                    <td>${slaPill}</td>
                    <td><span style="font-weight: 600;">${c.pyStatusWork}</span></td>
                    <td>
                        <div class="action-btn-group">
                            <button class="btn-action-sm inspect" onclick="app.showCaseTicketModal('${c.pyID}')"><i class="fa-solid fa-eye"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");
    }

    // ==========================================
    // NOTIFICATIONS & DRAWER
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
            container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No notifications</div>`;
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

    startSlaTimer() {
        setInterval(() => {
            window.pegaEngine.refreshAllCaseSLAs();
            if (this.currentView === "pega-portal") {
                this.renderPegaCasesTable();
                this.renderKpis();
            }
        }, 5000);
    }

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

    // ==========================================
    // USER AUTHENTICATION & LOGIN
    // ==========================================
    renderUserSessionPill() {
        const container = document.getElementById("userSessionContainer");
        if (!container) return;

        const user = window.pegaEngine.getLoggedInUser();
        if (user) {
            container.innerHTML = `
                <div class="user-profile-pill" style="display: flex; align-items: center; background: rgba(255,255,255,0.05); padding: 0.25rem 0.75rem; border-radius: var(--radius-full); border: 1px solid var(--border-light);">
                    <div class="role-avatar" style="background: var(--accent-gold); color: #000; font-weight: 700; width: 26px; height: 26px; line-height: 26px; font-size: 0.8rem; margin-right: 0.5rem; display: inline-block; border-radius: 50%; text-align: center;">
                        ${user.name.charAt(0)}
                    </div>
                    <div style="display: flex; flex-direction: column; text-align: left; margin-right: 0.5rem;">
                        <span style="font-weight: 600; font-size: 0.8rem; color: #fff;">${user.name}</span>
                        <a href="javascript:void(0)" onclick="app.handleLogout()" style="font-size: 0.7rem; color: var(--accent-gold); text-decoration: none; font-weight: 600;">Sign Out</a>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `
                <button class="btn-secondary" onclick="app.openAuthModal()" style="padding: 0.45rem 1rem; font-size: 0.8rem; border-radius: var(--radius-full); display: flex; align-items: center; gap: 0.5rem; border: 1px solid var(--border-light); background: rgba(255,255,255,0.05); color: #fff;">
                    <i class="fa-solid fa-right-to-bracket"></i> Login / Sign Up
                </button>
            `;
        }
    }

    openAuthModal() {
        document.getElementById("authModal").classList.add("open");
        this.switchAuthTab("login");
    }

    closeAuthModal() {
        document.getElementById("authModal").classList.remove("open");
    }

    switchAuthTab(tab) {
        const loginForm = document.getElementById("loginForm");
        const registerForm = document.getElementById("registerForm");
        const btnLogin = document.getElementById("btnSwitchLogin");
        const btnRegister = document.getElementById("btnSwitchRegister");
        const modalTitle = document.getElementById("authModalTitle");
        const modalSubtitle = document.getElementById("authModalSubtitle");

        if (tab === "login") {
            loginForm.style.display = "block";
            registerForm.style.display = "none";
            btnLogin.classList.add("btn-primary");
            btnLogin.classList.remove("btn-secondary");
            btnLogin.style.background = "";
            btnLogin.style.border = "";
            btnRegister.classList.add("btn-secondary");
            btnRegister.classList.remove("btn-primary");
            btnRegister.style.background = "transparent";
            btnRegister.style.border = "none";
            modalTitle.textContent = "Sign In to CineWave";
            modalSubtitle.textContent = "Access your bookings & digital tickets";
        } else {
            loginForm.style.display = "none";
            registerForm.style.display = "block";
            btnRegister.classList.add("btn-primary");
            btnRegister.classList.remove("btn-secondary");
            btnRegister.style.background = "";
            btnRegister.style.border = "";
            btnLogin.classList.add("btn-secondary");
            btnLogin.classList.remove("btn-primary");
            btnLogin.style.background = "transparent";
            btnLogin.style.border = "none";
            modalTitle.textContent = "Create Account";
            modalSubtitle.textContent = "Sign up to start booking cinema tickets";
        }
    }

    handleLoginSubmit(e) {
        e.preventDefault();
        const usernameInput = document.getElementById("loginUsername").value;
        const passwordInput = document.getElementById("loginPassword").value;

        try {
            const user = window.pegaEngine.loginUser(usernameInput, passwordInput);
            this.showToast(`Welcome back, ${user.name}!`, "success");
            this.closeAuthModal();
            this.renderUserSessionPill();
            
            if (this.currentView === "my-bookings") {
                this.renderMyBookings();
            }
        } catch (err) {
            this.showToast(err.message, "error");
        }
    }

    handleRegisterSubmit(e) {
        e.preventDefault();
        const usernameInput = document.getElementById("regUsername").value;
        const passwordInput = document.getElementById("regPassword").value;
        const nameInput = document.getElementById("regName").value;
        const emailInput = document.getElementById("regEmail").value;
        const mobileInput = document.getElementById("regMobile").value;

        try {
            const newUser = window.pegaEngine.registerUser(usernameInput, passwordInput, nameInput, emailInput, mobileInput);
            this.showToast("Account created successfully! Please login.", "success");
            this.switchAuthTab("login");
            
            // Prefill login form
            document.getElementById("loginUsername").value = newUser.username;
            document.getElementById("loginPassword").value = newUser.password;
        } catch (err) {
            this.showToast(err.message, "error");
        }
    }

    handleLogout() {
        window.pegaEngine.logoutUser();
        this.showToast("Signed out successfully.", "info");
        this.renderUserSessionPill();
        
        if (this.currentView === "my-bookings") {
            this.renderMyBookings();
        }
    }

    // ==========================================
    // PEGA OPERATOR SECURE AUTHENTICATION UI
    // ==========================================
    openPegaOperatorModal(roleName) {
        this.pendingOperatorRole = roleName;
        document.getElementById("pegaOperatorModal").classList.add("open");
        document.getElementById("pegaOperatorPassword").value = "";
        
        const idInput = document.getElementById("pegaOperatorId");
        if (roleName === "Booking Staff") {
            idInput.value = "arun@cinewave.in";
        } else if (roleName === "Cinema Manager") {
            idInput.value = "manager@cinewave.in";
        } else if (roleName === "Administrator") {
            idInput.value = "admin@cinewave.in";
        } else {
            idInput.value = "";
        }
    }

    closePegaOperatorModal() {
        document.getElementById("pegaOperatorModal").classList.remove("open");
        this.pendingOperatorRole = null;
    }

    handleOperatorLoginSubmit(e) {
        e.preventDefault();
        const opId = document.getElementById("pegaOperatorId").value;
        const opPass = document.getElementById("pegaOperatorPassword").value;

        try {
            const operator = window.pegaEngine.authenticateOperator(opId, opPass);
            
            if (operator.role !== this.pendingOperatorRole) {
                throw new Error(`Pega Routing Error: Operator is not authorized for the '${this.pendingOperatorRole}' workspace.`);
            }

            window.pegaEngine.currentUserRole = operator.role;
            document.getElementById("currentRoleLabel").textContent = operator.role;
            document.getElementById("currentRoleAvatar").textContent = operator.role.charAt(0);
            
            document.querySelectorAll(".role-option").forEach(opt => {
                opt.classList.remove("selected");
                if (opt.textContent.includes(operator.role)) opt.classList.add("selected");
            });

            this.closePegaOperatorModal();
            this.updateNavbarVisibility();
            this.showToast(`Welcome Operator: ${operator.name} (${operator.role})`, "success");
            this.navigateView("pega-portal");
        } catch (err) {
            this.showToast(err.message, "error");
        }
    }
}

// Global initialization
window.addEventListener("DOMContentLoaded", () => {
    window.app = new CineWaveApp();
});
