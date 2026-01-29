window.app = {
    data: {
        invoices: [],
        settings: {
            taxRate: 18,
            currency: 'FCFA',
            store: {
                name: "AKG 85 - GAYE & FRÈRE",
                address: ["RUE ARMAND ANGRAND X BLAISE DIAGNE -", "DAKAR / SENEGAL"],
                phone: "",
                email: "",
                logo: "logo_akg.png"
            }
        }
    },
    currentInvoiceId: null,
    triggerActionAfterShow: null, // 'pdf' | 'print' pour déclencher après affichage détail
    statusFilter: 'all',

    init: function () {
        if (typeof lucide !== 'undefined') lucide.createIcons();
        this.loadSettings();

        // Load data
        const stored = localStorage.getItem('akg85_invoices');
        if (stored) {
            this.data.invoices = JSON.parse(stored);
        } else {
            // Seed
            this.data.invoices = [{
                id: 'FAC-001', number: 'FAC-001',
                clientName: 'Client Exemple', clientPhone: '+221 77 000 00 00',
                date: '2026-01-29', dueDate: '2026-02-28',
                items: [{ designation: 'Produit Test', quantity: 1, unitPrice: 10000, total: 10000 }],
                subtotal: 10000, taxRate: 18, taxAmount: 1800,
                discountType: 'FIXED', discountValue: 0, discountAmount: 0,
                total: 11800, status: 'PAID', paidAmount: 11800,
                createdAt: new Date().toISOString()
            }];
            this.saveData();
        }

        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.applyFilters());
        }
        const statusFilterEl = document.getElementById('status-filter');
        if (statusFilterEl) {
            statusFilterEl.addEventListener('change', () => this.applyFilters());
        }

        this.applyFilters();
        this.updateStats();

        window.addEventListener('resize', function () {
            if (app.currentInvoiceId) app.applyMobileInvoiceScale();
        });

        this.hideSplash();
    },

    hideSplash: function () {
        var splash = document.getElementById('splash');
        if (!splash) return;
        var minDisplay = 800;
        var start = window._akg85_loadStart;
        var elapsed = (start != null && typeof performance !== 'undefined' && performance.now) ? (performance.now() - start) : 0;
        var delay = Math.max(0, minDisplay - elapsed);
        setTimeout(function () {
            splash.classList.add('splash-hidden');
            splash.setAttribute('aria-hidden', 'true');
            setTimeout(function () {
                splash.style.display = 'none';
            }, 420);
        }, delay);
    },

    applyFilters: function () {
        const searchInput = document.getElementById('search-input');
        const statusFilterEl = document.getElementById('status-filter');
        this.statusFilter = statusFilterEl ? statusFilterEl.value : 'all';
        const search = searchInput ? searchInput.value.trim() : '';
        this.renderList(search);
    },

    saveData: function () {
        localStorage.setItem('akg85_invoices', JSON.stringify(this.data.invoices));
        this.updateStats();
    },

    getStatusLabel: function (status) {
        const labels = { PENDING: 'En attente', PAID: 'Payée', PARTIAL: 'Partielle', CANCELLED: 'Annulée', REFUNDED: 'Remboursée' };
        return labels[status] || status;
    },
    getStatusClass: function (status) {
        const classes = { PENDING: 'bg-yellow-100', PAID: 'bg-green-100', PARTIAL: 'bg-blue-100', CANCELLED: 'bg-red-100', REFUNDED: 'bg-purple-100' };
        return classes[status] || 'bg-yellow-100';
    },

    updateStats: function () {
        const total = this.data.invoices.length;
        const paid = this.data.invoices.filter(i => i.status === 'PAID').length;
        const pending = this.data.invoices.filter(i => i.status === 'PENDING').length;
        const cancelled = this.data.invoices.filter(i => i.status === 'CANCELLED').length;

        document.getElementById('stat-total').textContent = total;
        document.getElementById('stat-paid').textContent = paid;
        document.getElementById('stat-pending').textContent = pending;
        document.getElementById('stat-cancelled').textContent = cancelled;
    },

    navigate: function (viewId) {
        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
        document.getElementById(`view-${viewId}`).classList.remove('hidden');

        const backBtn = document.getElementById('back-btn');
        const pageTitle = document.getElementById('page-title');

        if (viewId === 'dashboard') {
            backBtn.classList.add('hidden');
            if (pageTitle) pageTitle.textContent = 'Factures';
            this.applyFilters();
            this.currentInvoiceId = null;
        } else if (viewId === 'create') {
            backBtn.classList.remove('hidden');
            // If we are NOT editing (no currentInvoiceId set before call), reset form
            if (!this.currentInvoiceId) {
                this.resetCreateForm();
            }
        } else if (viewId === 'settings') {
            backBtn.classList.remove('hidden');
            this.loadSettings(); // Refresh form values
        } else {
            backBtn.classList.remove('hidden');
        }

        lucide.createIcons();
        window.scrollTo(0, 0);
    },

    resetCreateForm: function () {
        document.getElementById('form-title').textContent = "Nouvelle Facture";
        document.getElementById('create-form').reset();
        document.getElementById('invoice-id').value = '';
        document.getElementById('items-container').innerHTML = '';
        document.querySelector('input[name="date"]').value = new Date().toISOString().split('T')[0];

        // Set default tax rate from settings
        document.getElementById('tax-toggle').checked = (this.data.settings.taxRate > 0);

        this.addItemRow();
        this.calculateTotal();
    },

    editInvoice: function (id) {
        const inv = this.data.invoices.find(i => i.id === id);
        if (!inv) return;

        this.currentInvoiceId = id; // Mark as editing
        this.navigate('create');

        document.getElementById('form-title').textContent = "Modifier Facture " + inv.number;

        const form = document.getElementById('create-form');
        form.id.value = inv.id;
        form.clientName.value = inv.clientName || '';
        form.clientPhone.value = inv.clientPhone || '';
        form.clientEmail.value = inv.clientEmail || '';
        form.clientAddress.value = inv.clientAddress || '';
        form.date.value = inv.date;
        form.dueDate.value = inv.dueDate || '';
        form.notes.value = inv.notes || '';

        // Discount
        form.discountType.value = inv.discountType || 'FIXED';
        form.discountValue.value = inv.discountValue || 0;

        // Tax
        document.getElementById('tax-toggle').checked = (inv.taxRate > 0);

        // Items
        document.getElementById('items-container').innerHTML = '';
        inv.items.forEach(item => {
            this.addItemRow(item);
        });

        this.calculateTotal();
    },

    addItemRow: function (data = null) {
        const template = document.getElementById('item-template');
        const clone = template.content.cloneNode(true);

        if (data) {
            clone.querySelector('.item-desc').value = data.designation;
            clone.querySelector('.item-qty').value = data.quantity;
            clone.querySelector('.item-price').value = data.unitPrice;
        }

        document.getElementById('items-container').appendChild(clone);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    },

    calculateTotal: function () {
        let subtotal = 0;
        document.querySelectorAll('.product-row').forEach(row => {
            const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            subtotal += qty * price;
        });

        // Discount
        const discountType = document.querySelector('select[name="discountType"]').value;
        const discountVal = parseFloat(document.querySelector('input[name="discountValue"]').value) || 0;
        let discountAmount = 0;

        if (discountVal > 0) {
            if (discountType === 'PERCENT') {
                discountAmount = subtotal * (discountVal / 100);
            } else {
                discountAmount = discountVal;
            }
        }

        const afterDiscount = Math.max(0, subtotal - discountAmount);

        // Tax
        const taxEnabled = document.getElementById('tax-toggle').checked;
        const taxRate = this.data.settings.taxRate;
        const taxAmount = taxEnabled ? (afterDiscount * taxRate / 100) : 0;

        const total = afterDiscount + taxAmount;

        // Update UI
        document.getElementById('create-subtotal').textContent = this.formatMoney(subtotal);

        const discountRow = document.getElementById('discount-row');
        if (discountAmount > 0) {
            discountRow.classList.remove('hidden');
            document.getElementById('create-discount').textContent = '-' + this.formatMoney(discountAmount);
        } else {
            discountRow.classList.add('hidden');
        }

        const taxRow = document.getElementById('tax-row');
        if (taxEnabled) {
            taxRow.classList.remove('hidden');
            taxRow.querySelector('span:first-child').textContent = `TVA (${taxRate}%)`;
            document.getElementById('create-tax').textContent = this.formatMoney(taxAmount);
        } else {
            taxRow.classList.add('hidden');
        }

        document.getElementById('create-total').textContent = this.formatMoney(total);
        return { subtotal, discountAmount, taxAmount, total };
    },

    generateId: function () {
        const prefix = "FAC";
        const num = this.data.invoices.length + 101;
        return `${prefix}-${num}`;
    },

    formatMoney: function (amount) {
        return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
    },

    formatDate: function (dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
    },

    renderList: function (filter = '') {
        const listEl = document.getElementById('invoice-list');
        listEl.innerHTML = '';

        let filtered = this.data.invoices.filter(inv =>
            inv.clientName.toLowerCase().includes(filter.toLowerCase()) ||
            (inv.number && inv.number.toLowerCase().includes(filter.toLowerCase()))
        );
        if (this.statusFilter && this.statusFilter !== 'all') {
            filtered = filtered.filter(inv => inv.status === this.statusFilter);
        }
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (filtered.length === 0) {
            const hasFilters = filter || (this.statusFilter && this.statusFilter !== 'all');
            listEl.innerHTML = `
                <div class="empty-state">
                    <i data-lucide="file-text" class="empty-state-icon" aria-hidden="true"></i>
                    <h3 class="empty-state-title">Aucune facture</h3>
                    <p class="empty-state-text">${hasFilters ? 'Aucune facture ne correspond à vos critères' : 'Créez votre première facture'}</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        // Desktop Table
        const tableContainer = document.createElement('div');
        tableContainer.className = 'card md-block table-container';
        tableContainer.style.padding = '0';

        let tableHtml = `
            <table class="table">
                <thead>
                    <tr>
                        <th style="width: 120px;">N° Facture</th>
                        <th>Client</th>
                        <th>Date</th>
                        <th class="text-right">Montant</th>
                        <th>Statut</th>
                        <th style="width: 50px;"></th>
                    </tr>
                </thead>
                <tbody>
        `;

        filtered.forEach(inv => {
            const statusClass = this.getStatusClass(inv.status);
            const statusLabel = this.getStatusLabel(inv.status);

            tableHtml += `
                <tr onclick="app.showInvoice('${inv.id}')" style="cursor: pointer;">
                    <td style="font-family: monospace; font-weight: 500;">${inv.number}</td>
                    <td>${inv.clientName}</td>
                    <td class="text-muted-foreground">
                        <div style="display: flex; align-items: center; gap: 0.25rem;">
                             <i data-lucide="calendar" style="width: 1rem; height: 1rem;"></i> ${this.formatDate(inv.date)}
                        </div>
                    </td>
                    <td class="text-right font-semibold">${this.formatMoney(inv.total)}</td>
                    <td><span class="badge ${statusClass}">${statusLabel}</span></td>
                    <td onclick="event.stopPropagation();" style="padding: 0.25rem;">
                        <div style="display: flex; align-items: center; gap: 0.25rem;">
                            <button type="button" class="btn btn-ghost btn-icon-only" title="Voir" onclick="app.showInvoice('${inv.id}')"><i data-lucide="eye" style="width: 1rem;"></i></button>
                            <button type="button" class="btn btn-ghost btn-icon-only" title="Télécharger PDF" onclick="app.triggerThenShow('${inv.id}', 'pdf')"><i data-lucide="download" style="width: 1rem;"></i></button>
                            <button type="button" class="btn btn-ghost btn-icon-only" title="Imprimer" onclick="app.triggerThenShow('${inv.id}', 'print')"><i data-lucide="printer" style="width: 1rem;"></i></button>
                        </div>
                    </td>
                </tr>
             `;
        });

        tableHtml += `</tbody></table>`;
        tableContainer.innerHTML = tableHtml;
        listEl.appendChild(tableContainer);

        // Mobile Cards
        const cardContainer = document.createElement('div');
        cardContainer.className = 'md-hidden space-y-4';

        filtered.forEach(inv => {
            const statusClass = this.getStatusClass(inv.status);
            const statusLabel = this.getStatusLabel(inv.status);

            const el = document.createElement('div');
            el.className = 'card';
            el.innerHTML = `
                <div class="card-content" style="padding: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                        <div style="cursor: pointer; flex: 1;" data-invoice-id="${inv.id}">
                            <div style="font-family: monospace; font-weight: 500; font-size: 0.875rem;">${inv.number}</div>
                            <div class="font-semibold text-sm" style="margin-top: 0.25rem;">${inv.clientName}</div>
                        </div>
                        <span class="badge ${statusClass}">${statusLabel}</span>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 0.5rem; color: #64748b; font-size: 0.875rem; margin-bottom: 0.5rem;" data-invoice-id="${inv.id}">
                        <i data-lucide="calendar" style="width: 1rem;"></i>
                        ${this.formatDate(inv.date)}
                    </div>
                    
                    <div class="text-lg font-semibold" data-invoice-id="${inv.id}">
                        ${this.formatMoney(inv.total)}
                    </div>
                    <div style="display: flex; gap: 0.5rem; margin-top: 0.75rem; flex-wrap: wrap;">
                        <button type="button" class="btn btn-outline" style="flex: 1; min-width: 0;" onclick="app.showInvoice('${inv.id}')"><i data-lucide="eye" style="width: 1rem; margin-right: 0.25rem;"></i> Voir</button>
                        <button type="button" class="btn btn-outline" style="flex: 1; min-width: 0;" onclick="app.triggerThenShow('${inv.id}', 'pdf')"><i data-lucide="download" style="width: 1rem; margin-right: 0.25rem;"></i> PDF</button>
                        <button type="button" class="btn btn-outline" style="flex: 1; min-width: 0;" onclick="app.triggerThenShow('${inv.id}', 'print')"><i data-lucide="printer" style="width: 1rem; margin-right: 0.25rem;"></i> Impr.</button>
                    </div>
                </div>
            `;
            el.querySelectorAll('[data-invoice-id]').forEach(node => {
                node.style.cursor = 'pointer';
                node.addEventListener('click', (e) => { if (e.target.tagName !== 'BUTTON' && !e.target.closest('button')) app.showInvoice(inv.id); });
            });
            cardContainer.appendChild(el);
        });
        listEl.appendChild(cardContainer);

        lucide.createIcons();
    },

    saveInvoice: function (e) {
        e.preventDefault();
        try {
            const form = e.target;
            const items = [];

            document.querySelectorAll('.product-row').forEach(row => {
                const designation = row.querySelector('.item-desc').value;
                const quantity = parseFloat(row.querySelector('.item-qty').value);
                const unitPrice = parseFloat(row.querySelector('.item-price').value);

                if (designation && quantity > 0) {
                    items.push({ designation, quantity, unitPrice, total: quantity * unitPrice });
                }
            });

            if (items.length === 0) { alert("Ajoutez au moins un article."); return; }

            const totals = this.calculateTotal();
            const existingId = document.getElementById('invoice-id').value; // Get from hidden input correctly
            const id = existingId || this.generateId();

            const invoiceData = {
                id: id,
                number: id,
                clientName: form.clientName.value,
                clientPhone: form.clientPhone.value,
                clientEmail: form.clientEmail.value,
                clientAddress: form.clientAddress.value,
                date: form.date.value,
                dueDate: form.dueDate.value,
                items: items,
                subtotal: totals.subtotal,
                discountType: form.discountType.value,
                discountValue: parseFloat(form.discountValue.value) || 0,
                discountAmount: totals.discountAmount,
                taxRate: document.getElementById('tax-toggle').checked ? this.data.settings.taxRate : 0,
                taxAmount: totals.taxAmount,
                total: totals.total,
                notes: form.notes.value,
                status: existingId ? this.data.invoices.find(i => i.id === existingId).status : 'PENDING',
                paidAmount: existingId ? this.data.invoices.find(i => i.id === existingId).paidAmount : 0,
                updatedAt: new Date().toISOString()
            };

            if (!existingId) {
                invoiceData.createdAt = new Date().toISOString();
                this.data.invoices.unshift(invoiceData);
            } else {
                const index = this.data.invoices.findIndex(i => i.id === existingId);
                if (index !== -1) {
                    this.data.invoices[index] = { ...this.data.invoices[index], ...invoiceData };
                }
            }

            this.saveData();
            this.currentInvoiceId = null;
            this.navigate('dashboard');
        } catch (err) {
            console.error(err);
            alert("Erreur lors de l'enregistrement: " + err.message);
        }
    },

    triggerThenShow: function (id, action) {
        this.triggerActionAfterShow = action;
        this.showInvoice(id);
    },

    showInvoice: function (id) {
        const inv = this.data.invoices.find(i => i.id === id);
        if (!inv) return;

        this.currentInvoiceId = id;
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) pageTitle.textContent = inv.number;
        const statusSelect = document.getElementById('status-select');
        if (statusSelect) statusSelect.value = inv.status || 'PENDING';

        const container = document.getElementById('invoice-preview-container');
        const settings = this.data.settings.store;

        // Format devise comme référence : F.CFA 648.000,00 (point milliers, virgule décimales)
        const formatCurrency = (amount) => {
            const formatted = new Intl.NumberFormat('de-DE', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(amount);
            return 'F.CFA ' + formatted;
        };

        // Format date like Admin Console
        const formatDateShort = (dateStr) => {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            const months = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
            return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
        };

        container.innerHTML = `
             <!-- En-tête bleu marine - Carte de visite à gauche, FACTURE à droite (référence AKG) -->
             <div class="invoice-header" style="padding: 24px; position: relative; overflow: hidden; background-color: #2563eb; color: #ffffff; font-family: Arial, Helvetica, sans-serif;">
                  <div class="invoice-header-inner" style="display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 10; gap: 20px;">
                      <div class="invoice-header-left" style="flex: 1; display: flex; align-items: center; min-width: 0;">
                          <img src="carte-visite.png" alt="AKG 85 - Carte de visite" class="invoice-carte" style="height: 120px; max-width: 320px; width: auto; object-fit: contain;">
                      </div>
                      <div class="invoice-header-right" style="text-align: right; flex-shrink: 0;">
                          <div class="invoice-title" style="font-size: 48px; font-weight: bold; margin-bottom: 16px; letter-spacing: 0.02em;">FACTURE</div>
                          <div class="invoice-meta" style="font-size: 16px; line-height: 1.5;">
                              <div style="margin-bottom: 4px;">Numéro: ${inv.number}</div>
                              <div style="margin-bottom: 4px;">Date ${formatDateShort(inv.date)}</div>
                              <div>Date d'échéance: ${inv.dueDate ? formatDateShort(inv.dueDate) : 'À la réception'}</div>
                          </div>
                      </div>
                  </div>
             </div>

             <!-- FACTURE À / FACTURE DE - fond blanc, texte noir -->
             <div class="invoice-to-from" style="display: flex; justify-content: space-between; padding: 24px; border-bottom: 2px solid #e5e7eb; gap: 24px; font-family: Arial, Helvetica, sans-serif; color: #000000;">
                 <div class="invoice-to-from-left" style="flex: 1; min-width: 0;">
                     <div style="font-weight: 600; font-size: 16px; margin-bottom: 8px; color: #000000;">FACTURE À:</div>
                     <div style="font-size: 17px; font-weight: 700; color: #000000;">${inv.clientName}</div>
                     ${inv.clientPhone ? `<div style="font-size: 14px; color: #374151; margin-top: 4px;">${inv.clientPhone}</div>` : ''}
                     ${inv.clientAddress ? `<div style="font-size: 14px; color: #374151; margin-top: 4px;">${inv.clientAddress}</div>` : ''}
                     ${inv.clientEmail ? `<div style="font-size: 14px; color: #374151; margin-top: 4px;">${inv.clientEmail}</div>` : ''}
                 </div>
                 <div class="invoice-to-from-right" style="flex: 1; text-align: right; min-width: 0;">
                     <div style="font-weight: 600; font-size: 16px; margin-bottom: 8px; color: #000000;">FACTURE DE:</div>
                     <div style="font-size: 17px; font-weight: 700; color: #000000;">${settings.name}</div>
                     ${settings.phone ? `<div style="font-size: 14px; color: #374151; margin-top: 4px;">${settings.phone}</div>` : ''}
                     ${settings.email ? `<div style="font-size: 14px; color: #374151; margin-top: 4px;">${settings.email}</div>` : ''}
                     ${Array.isArray(settings.address) ? settings.address.map(l => `<div style="font-size: 14px; color: #374151; margin-top: 4px;">${l}</div>`).join('') : (settings.address ? `<div style="font-size: 14px; color: #374151; margin-top: 4px;">${settings.address}</div>` : '')}
                 </div>
             </div>

             <!-- Tableau des articles - en-tête bleu marine, lignes fond blanc -->
             <div class="invoice-items-wrap" style="padding: 24px; overflow-x: auto; -webkit-overflow-scrolling: touch; font-family: Arial, Helvetica, sans-serif;">
                 <table class="invoice-items-table" style="width: 100%; min-width: 400px; border-collapse: collapse; font-size: 15px;">
                     <thead>
                         <tr style="background-color: #2563eb; color: #ffffff;">
                             <th style="text-align: left; padding: 12px 16px; font-weight: 600;">Description</th>
                             <th style="text-align: center; padding: 12px 16px; font-weight: 600; width: 96px;">Quantité</th>
                             <th style="text-align: right; padding: 12px 16px; font-weight: 600; width: 140px;">Prix unitaire</th>
                             <th style="text-align: right; padding: 12px 16px; font-weight: 600; width: 140px;">Montant</th>
                         </tr>
                     </thead>
                     <tbody>
                         ${inv.items.map((item) => `
                             <tr style="background-color: #ffffff;">
                                 <td style="padding: 12px 16px; color: #000000; border-bottom: 1px solid #e5e7eb;">${item.designation}</td>
                                 <td style="padding: 12px 16px; text-align: center; color: #000000; border-bottom: 1px solid #e5e7eb;">${item.quantity}</td>
                                 <td style="padding: 12px 16px; text-align: right; color: #000000; border-bottom: 1px solid #e5e7eb;">${formatCurrency(item.unitPrice)}</td>
                                 <td style="padding: 12px 16px; text-align: right; font-weight: 600; color: #000000; border-bottom: 1px solid #e5e7eb;">${formatCurrency(item.total)}</td>
                             </tr>
                         `).join('')}
                     </tbody>
                 </table>
             </div>

             <!-- Récapitulatif - SOUS-TOTAL, TOTAL, PAYÉE, SOLDE À PAYER (barre noire) -->
             <div class="invoice-summary-wrap" style="display: flex; justify-content: flex-end; padding: 0 24px 24px; font-family: Arial, Helvetica, sans-serif;">
                 <div class="invoice-summary" style="width: 320px; max-width: 100%; color: #000000;">
                     <div style="display: flex; justify-content: space-between; font-size: 16px; margin-bottom: 12px;">
                         <span style="font-weight: 600;">SOUS-TOTAL</span>
                         <span style="font-weight: 600;">${formatCurrency(inv.subtotal)}</span>
                     </div>
                     ${inv.taxRate > 0 ? `
                     <div style="display: flex; justify-content: space-between; font-size: 16px; margin-bottom: 12px;">
                         <span>TVA (${inv.taxRate}%)</span>
                         <span>${formatCurrency(inv.taxAmount)}</span>
                     </div>
                     ` : ''}
                     ${(inv.discountAmount || 0) > 0 ? `
                     <div style="display: flex; justify-content: space-between; font-size: 16px; margin-bottom: 12px; color: #16a34a;">
                         <span>Remise</span>
                         <span>-${formatCurrency(inv.discountAmount)}</span>
                     </div>
                     ` : ''}
                     <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; padding-top: 8px; border-top: 2px solid #d1d5db; margin-bottom: 12px;">
                         <span>TOTAL</span>
                         <span>${formatCurrency(inv.total)}</span>
                     </div>
                     <div style="display: flex; justify-content: space-between; font-size: 16px; margin-bottom: 12px;">
                         <span>PAYÉE</span>
                         <span>${formatCurrency(inv.status === 'PAID' ? inv.total : (inv.paidAmount || 0))}</span>
                     </div>
                     <div style="padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; font-weight: bold; font-size: 18px; background-color: #000000; color: #ffffff;">
                         <span>SOLDE À PAYER</span>
                         <span>${formatCurrency(inv.status === 'PAID' ? 0 : (inv.total - (inv.paidAmount || 0)))}</span>
                     </div>
                 </div>
             </div>
             
             ${inv.notes ? `
             <div class="invoice-notes" style="padding: 0 24px 24px; font-family: Arial, Helvetica, sans-serif;">
                 <div style="font-weight: 600; margin-bottom: 8px; font-size: 14px; color: #000000;">Notes:</div>
                 <div style="font-size: 14px; color: #374151; white-space: pre-wrap;">${inv.notes}</div>
             </div>
             ` : ''}

             <!-- Pied de page - MERCI POUR VOTRE CONFIANCE en bleu marine -->
             <div class="invoice-footer" style="text-align: center; padding: 24px; border-top: 2px solid #e5e7eb; font-family: Arial, Helvetica, sans-serif;">
                 <div style="font-size: 18px; font-weight: 700; color: #2563eb;">MERCI POUR VOTRE CONFIANCE</div>
             </div>
        `;

        this.navigate('detail');
        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Mobile : appliquer le scale pour même rendu que la référence (fit largeur)
        const self = this;
        setTimeout(function () { self.applyMobileInvoiceScale(); }, 100);
        setTimeout(function () { self.applyMobileInvoiceScale(); }, 500);

        // Déclencher PDF ou Imprimer après affichage (depuis la liste)
        const action = this.triggerActionAfterShow;
        if (action) {
            this.triggerActionAfterShow = null;
            setTimeout(function () {
                if (action === 'pdf') self.downloadPDF();
                else if (action === 'print') self.printInvoice();
            }, 600);
        }
    },

    applyMobileInvoiceScale: function () {
        var scaleEl = document.getElementById('invoice-mobile-scale');
        var paper = document.getElementById('invoice-preview-container');
        if (!scaleEl || !paper) return;

        var vw = window.innerWidth;
        var PAPER_PX = 794;
        var padding = 24;

        if (vw <= 768) {
            var scale = Math.min(1, (vw - padding) / PAPER_PX);
            paper.style.transform = 'scale(' + scale + ')';
            paper.style.transformOrigin = 'top left';
            var h = paper.offsetHeight;
            scaleEl.style.width = (PAPER_PX * scale) + 'px';
            scaleEl.style.height = (h * scale) + 'px';
            scaleEl.style.overflow = 'hidden';
        } else {
            paper.style.transform = '';
            paper.style.transformOrigin = '';
            scaleEl.style.width = '';
            scaleEl.style.height = '';
            scaleEl.style.overflow = '';
        }
    },

    printInvoice: function () {
        window.print();
    },

    downloadPDF: async function () {
        const inv = this.data.invoices.find(i => i.id === this.currentInvoiceId);
        if (!inv) return;

        try {
            const container = document.getElementById('invoice-preview-container');
            if (!container) {
                alert("Erreur: conteneur de facture non trouvé");
                return;
            }

            // Wait for images to load
            await new Promise(resolve => setTimeout(resolve, 500));

            // Use html2canvas to capture the invoice
            const canvas = await html2canvas(container, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff',
                logging: false,
                allowTaint: true,
            });

            // Create PDF
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            const maxHeight = pdf.internal.pageSize.getHeight();
            const finalHeight = pdfHeight > maxHeight ? maxHeight : pdfHeight;

            const imgData = canvas.toDataURL('image/png', 0.95);
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, finalHeight);
            pdf.save(`${inv.number || 'facture'}.pdf`);

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert("Erreur lors de la génération du PDF. Utilisez l'impression du navigateur comme alternative.");
        }
    },

    updateStatus: function (newStatus) {
        const inv = this.data.invoices.find(i => i.id === this.currentInvoiceId);
        if (inv) {
            inv.status = newStatus;
            if (newStatus === 'PAID') inv.paidAmount = inv.total;
            else if (newStatus === 'PENDING' || newStatus === 'CANCELLED' || newStatus === 'REFUNDED') inv.paidAmount = 0;
            else if (newStatus === 'PARTIAL') inv.paidAmount = inv.paidAmount != null ? inv.paidAmount : 0;

            this.saveData();
            this.showInvoice(this.currentInvoiceId);
        }
    },

    deleteInvoice: function (id) {
        if (confirm('Supprimer cette facture ?')) {
            this.data.invoices = this.data.invoices.filter(i => i.id !== id);
            this.saveData();
            this.navigate('dashboard');
        }
    },

    goBack: function () {
        this.navigate('dashboard');
    },

    loadSettings: function () {
        const stored = localStorage.getItem('akg85_settings');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                this.data.settings = parsed;
                if (!this.data.settings.store) this.data.settings.store = {};
                const s = this.data.settings.store;
                if (!Array.isArray(s.address)) s.address = s.address ? [s.address] : ['', ''];
            } catch (e) {}
        }

        // Apply to Header Logo
        const logoImg = document.getElementById('header-logo');
        if (this.data.settings.store && this.data.settings.store.logo && logoImg) {
            logoImg.src = this.data.settings.store.logo;
        }

        // Populate Settings Form
        const form = document.getElementById('settings-form');
        if (form) {
            const s = this.data.settings.store || {};
            const addr = Array.isArray(s.address) ? s.address : [s.address || '', ''];
            form.storeName.value = s.name || '';
            form.storeAddress1.value = addr[0] || '';
            form.storeAddress2.value = addr[1] || '';
            form.storePhone.value = s.phone || '';
            form.storeEmail.value = s.email || '';
            form.storeLogo.value = s.logo || '';
            form.currency.value = this.data.settings.currency || 'FCFA';
            form.taxRate.value = this.data.settings.taxRate ?? 18;
        }
    },

    saveSettings: function (e) {
        e.preventDefault();
        const form = e.target;
        if (!this.data.settings.store) this.data.settings.store = {};

        this.data.settings.store.name = form.storeName.value;
        this.data.settings.store.address = [
            form.storeAddress1.value,
            form.storeAddress2.value
        ].filter(Boolean);
        this.data.settings.store.phone = form.storePhone.value;
        this.data.settings.store.email = form.storeEmail ? form.storeEmail.value : '';
        this.data.settings.store.logo = form.storeLogo.value;

        this.data.settings.currency = form.currency.value;
        this.data.settings.taxRate = parseFloat(form.taxRate.value) || 18;

        localStorage.setItem('akg85_settings', JSON.stringify(this.data.settings));

        // Update live elements
        const logoImg = document.getElementById('header-logo');
        if (this.data.settings.store.logo && logoImg) {
            logoImg.src = this.data.settings.store.logo;
        }

        alert('Paramètres enregistrés');
        this.navigate('dashboard');
    }
};

// Start
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
