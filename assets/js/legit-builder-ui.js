    function escapeV(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function updateValidation() {
      var partCount = Object.keys(selectedParts).length;
      if (partCount === 0) {
        validationEl.className = 'validation-bar v-idle';
        validationEl.innerHTML = 'Select parts to validate.';
        return;
      }
      var st = computeLegitValidationState(selectedItem, selectedParts, {});
      validationEl.className = 'validation-bar ' + st.className;
      var metaRe = /^(Parts:|Sources:|Stats by|Stats known|Missing stat examples|Level range:|Item level:)/;
      var detailLines = '';
      var di;
      for (di = 0; di < st.details.length; di++) {
        var line = st.details[di];
        detailLines += '<div class="v-detail-line' + (metaRe.test(line) ? ' v-detail-meta' : '') + '">' + escapeV(line) + '</div>';
      }
      validationEl.innerHTML = '<strong>' + escapeV(st.statusText) + '</strong><div class="v-details">' + detailLines + '</div>' + st.miniLineageHtml;
    }
    itemSelect.addEventListener('change', function() {
      var slug = itemSelect.value;
      if (!slug) {
        selectedItem = null;
        slotsContainer.innerHTML = '<div class="slot-empty-msg">Select an item type above to see available slots.</div>';
        outputEl.innerHTML = '<span class="o-empty">Select an item type and parts to begin.</span>';
        outputEl.dataset.plain = '';
        validationEl.className = 'validation-bar v-idle';
        validationEl.innerHTML = 'Select parts to validate.';
        itemStatsEl.innerHTML = '<div class="stats-empty">Select an item type to see info.</div>';
        statEffectsEl.innerHTML = '<div class="stats-empty">Select parts to see their stat effects.</div>';
        proofEvidenceEl.innerHTML = '<div class="stats-empty">Select parts to view proof details.</div>';
        return;
      }
      selectedItem = getAllItems().find(function(i) { return i.slug === slug; });
      if (!selectedItem) return;
      renderSlots(selectedItem);
      updateOutput();
      updateValidation();
      updateItemStats();
      updateStatEffects();
      updateDropSources();
      updateProofEvidence();
      updateDataHealthPanel();
    });

    copyBtn.addEventListener('click', function() {
      var code = codeOutput.textContent || '';
      if (!code.trim() || codeOutput.classList.contains('empty')) return;
      navigator.clipboard.writeText(code).then(function() {
        copyBtn.textContent = 'Copied!';
        setTimeout(function() { copyBtn.textContent = 'Copy Code'; }, 1500);
      });
    });

    resetBtn.addEventListener('click', function() {
      selectedParts = {};
      if (selectedItem) renderSlots(selectedItem);
      updateOutput();
      updateValidation();
      updateItemStats();
      updateStatEffects();
      updateDropSources();
      updateProofEvidence();
      updateDataHealthPanel();
    });

    spawnToggle.addEventListener('change', function() {
      useSpawnMode = spawnToggle.checked;
      modeLabelNum.className = 'mode-label' + (useSpawnMode ? '' : ' active');
      modeLabelSpawn.className = 'mode-label' + (useSpawnMode ? ' active' : '');
      updateCodeOutput();
    });

    if (strictModeToggle) {
      strictModeToggle.addEventListener('change', function() {
        strictMode = !!strictModeToggle.checked;
        updateValidation();
        updateProofEvidence();
      });
    }

    if (itemLevelInput) {
      itemLevelInput.addEventListener('input', function() {
        updateCodeOutput();
        updateValidation();
        updateProofEvidence();
      });
      itemLevelInput.addEventListener('change', function() {
        updateCodeOutput();
        updateValidation();
        updateProofEvidence();
      });
    }

    populateItemTypes();
    updateDataHealthPanel();
    if (M.stats && M.stats.definitions) {
      statsRef.textContent = 'Stats: ' + M.stats.definitions.map(function(d) { return d.id; }).join(', ');
    }
