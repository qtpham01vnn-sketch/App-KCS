export const exportProductionLogPDF = (selectedLog) => {
  if (!selectedLog) return;
  
  try {
    const kilnData = selectedLog.kiln_data || {};
    const kilnType = selectedLog.kiln_type;
    const labInfo = typeof selectedLog.lab_info === 'string' ? JSON.parse(selectedLog.lab_info) : selectedLog.lab_info;
    
    const newWin = window.open('', '_blank');
    if (!newWin) {
      alert("Vui lòng cho phép Pop-up (Cửa sổ bật lên) trên trình duyệt để xem báo cáo!");
      return;
    }

    // Generate HTML Report Content (High Fidelity)
    let sectionsHtml = "";

    if (kilnType === 'Máy Nghiền') {
      const materials = labInfo?.materials || [];
      sectionsHtml = `
        <div class="section-title">I. CHI TIẾT NẠP LIỆU THỰC TẾ</div>
        <table>
          <thead>
            <tr style="background: #f8fafc; color: #64748b;">
              <th style="width: 10%; text-align: center;">STT</th>
              <th style="width: 40%;">Nguyên liệu</th>
              <th style="width: 15%;">Kho</th>
              <th style="width: 10%; text-align: right;">Khô (kg)</th>
              <th style="width: 10%; text-align: right;">Ẩm (%)</th>
              <th style="width: 15%; text-align: right; color: #10b981;">Thực tế (kg)</th>
            </tr>
          </thead>
          <tbody>
            ${materials.map((m, i) => `
              <tr>
                <td style="text-align: center; color: #64748b;">${m.stt || i + 1}</td>
                <td><b>${m.name}</b></td>
                <td style="font-size: 11px; text-transform: uppercase; color: #64748b;">${m.position}</td>
                <td style="text-align: right;">${m.dry_weight?.toLocaleString()}</td>
                <td style="text-align: right; color: #3b82f6;">${m.humidity}%</td>
                <td style="text-align: right; font-weight: 900; color: #10b981;">${m.actual_weight?.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="display: flex; justify-content: flex-end; gap: 40px; margin-top: 20px; padding: 20px; background: #f8fafc; border-radius: 12px;">
          <div style="text-align: center;">
            <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold;">Tổng nạp thực tế</div>
            <div style="font-size: 20px; font-weight: 900; color: #10b981;">${labInfo?.totalActual?.toLocaleString()} kg</div>
          </div>
          <div style="width: 1px; background: #e2e8f0;"></div>
          <div style="text-align: center;">
            <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: bold;">Nước nạp</div>
            <div style="font-size: 20px; font-weight: 900; color: #3b82f6;">${labInfo?.waterAdded?.toLocaleString()} kg</div>
          </div>
        </div>
      `;
    } else if (kilnType === 'Nhật ký QC Ca') {
      const qcData = labInfo || {};
      const renderQCSection = (title, data) => {
        if (!data || data.length === 0) return '';
        return `
          <div class="section-title">${title}</div>
          <table class="grid-table">
            <thead>
              <tr>
                <th>Mã/Máy</th><th>Thời gian</th><th>D (g/l)</th><th>V (s)</th><th>R (%)</th><th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  <td><b>${row.code || row.machine_no}</b></td>
                  <td>${row.time}</td>
                  <td style="color: #10b981; font-weight: bold;">${row.d || ''}</td>
                  <td style="color: #3b82f6; font-weight: bold;">${row.v || ''}</td>
                  <td style="color: #f59e0b; font-weight: bold;">${row.r || ''}</td>
                  <td style="text-align: left; font-size: 9px;">${row.notes || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      };

      const renderPowderSection = (title, data) => {
        if (!data || data.length === 0) return '';
        return `
          <div class="section-title">${title}</div>
          <table class="grid-table">
            <thead>
              <tr>
                <th>Giờ</th><th>Hầm/Silo</th><th>W (%)</th><th>> 0.6</th><th>> 0.45</th><th>0.125-0.6</th><th>< 0.125</th>
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  <td>${row.time}</td>
                  <td><b>${row.hầm || row.silo || row.code}</b></td>
                  <td style="color: #10b981; font-weight: bold;">${row.moisture}</td>
                  <td>${row.grain_06}</td>
                  <td>${row.grain_045}</td>
                  <td>${row.grain_0125_045}</td>
                  <td>${row.grain_under_0125}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      };

      sectionsHtml = `
        ${renderQCSection('I. KIỂM SOÁT HỒ NGHIỀN XƯƠNG', qcData.biscuit_slurry)}
        ${renderQCSection('II. KIỂM SOÁT HỒ NGHIỀN MEN', qcData.glaze_slurry)}
        ${renderPowderSection('III. KIỂM SOÁT BỘT SẤY PHUN', qcData.spray_powder)}
        ${renderPowderSection('IV. KIỂM SOÁT BỘT CẤP ÉP', qcData.pressing_powder)}
      `;
    } else {
      // Traditional Kiln/Dryer layout
      sectionsHtml = `
        <div class="section-title">I. THÔNG SỐ KỸ THUẬT / LAB</div>
        <table>
          <tr><th>Sản phẩm</th><td><b>${selectedLog.product_type}</b></td></tr>
          ${kilnType === 'Lò Sấy' ? `
            <tr><th>Độ ẩm (%)</th><td>${selectedLog.strength_value}%</td></tr>
            <tr><th>Cường độ</th><td>${labInfo?.cuongDo || '---'}</td></tr>
            <tr><th>Chu kỳ ép</th><td>${kilnData.metadata?.ckEp || '---'}</td></tr>
            <tr><th>Thời gian</th><td>${kilnData.metadata?.thoiGian || '---'}</td></tr>
          ` : `
            <tr><th>Dây chuyền</th><td><b>${labInfo?.dayChuyen || kilnData.metadata?.dayChuyen || '---'}</b></td></tr>
            <tr><th>Chỉ số Lab</th><td>${selectedLog.strength_value}${selectedLog.kiln_type === 'Lò Sấy' ? '%' : 'N'}</td></tr>
            <tr><th>Bền uốn (N/mm²)</th><td>${labInfo?.benUon || '---'}</td></tr>
            <tr><th>Độ dày min (mm)</th><td>${labInfo?.dayMin || '---'}</td></tr>
            <tr><th>Độ hút nước (%)</th><td>${labInfo?.doHutNuoc || '---'}</td></tr>
            <tr><th>Bài xương</th><td>${labInfo?.baiXuong || '---'}</td></tr>
            <tr><th>Men Engobe</th><td>${labInfo?.menEngobe || '---'}</td></tr>
            <tr><th>Men nền</th><td>${labInfo?.menNen || '---'}</td></tr>
          `}
        </table>

        <div class="section-title">II. DỮ LIỆU NHIỆT ĐỘ CHI TIẾT</div>
        ${kilnType === 'Lò Sấy' ? `
          <table class="grid-table">
            <thead>
              <tr><th>T/K</th>${Array.from({length: 12}, (_, i) => `<th>K.${i+1}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${[1, 2, 3, 4, 5].map(f => `
                <tr>
                  <td style="background: #f8fafc; font-weight: 900; color: #0f172a;">Tầng ${f}</td>
                  ${Array.from({length: 12}, (_, z) => {
                    const cell = (kilnData.grid || []).find(g => g.zone === z+1 && g.floor === f);
                    return `
                      <td style="padding: 4px;">
                        <div style="display: flex; flex-direction: column; gap: 2px;">
                          <div style="background: #eff6ff; color: #1e40af; font-weight: 900; border-radius: 4px; padding: 2px 0;">${cell?.t || '--'}</div>
                          <div style="background: #fdf2f8; color: #9d174d; font-weight: 900; border-radius: 4px; padding: 2px 0;">${cell?.p || '--'}</div>
                        </div>
                      </td>
                    `;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `
          <table>
            <thead>
              <tr><th>Module</th><th>Nhiệt Trên (PV / SV)</th><th>Nhiệt Dưới (PV / SV)</th></tr>
            </thead>
            <tbody>
              ${(Array.isArray(kilnData.nhietDo) ? kilnData.nhietDo : Array.isArray(kilnData.filteredModules) ? kilnData.filteredModules : []).filter(m => !m.id.startsWith('M0')).map(m => {
                const zoneId = m.id.replace(/\D/g, '');
                const bottom = (Array.isArray(kilnData.nhietDo) ? kilnData.nhietDo : []).find(x => x.id === `M0${zoneId}`);
                return `
                  <tr>
                    <td><b>M${zoneId}</b></td>
                    <td><span class="temp-pv">${m.pv}</span> <span class="temp-sv">${m.sv}</span></td>
                    <td><span class="temp-pv">${bottom?.pv || '--'}</span> <span class="temp-sv">${bottom?.sv || '--'}</span></td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        `}

        ${kilnType !== 'Lò Sấy' ? `
          <div class="section-title">III. TRẠNG THÁI HỆ THỐNG QUẠT & ÁP SUẤT</div>
          <div style="display: flex; gap: 20px;">
            <table style="flex: 1;">
              <thead><tr><th>Hệ thống Quạt</th><th>Hz</th></tr></thead>
              <tbody>
                ${(kilnData.quat || []).filter(q => !['M7', 'M11', 'M14', 'M17', 'M19', 'M20'].some(s => q.name.toUpperCase().startsWith(s))).map(q => `
                  <tr><td>${q.name}</td><td><b>${q.hz}</b></td></tr>
                `).join('')}
              </tbody>
            </table>
            <table style="flex: 1;">
              <thead><tr><th>Áp suất</th><th>Pa</th></tr></thead>
              <tbody>
                ${(kilnData.apSuat || []).filter(p => ['TP1', 'TP2', 'TP3', 'TP4', 'TP5', 'MC1'].includes(p.id.toUpperCase())).map(p => `
                  <tr><td>${p.id}</td><td><b>${p.val}</b></td></tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
      `;
    }

    let dateString = 'N/A';
    try {
      const d = new Date(selectedLog.created_at);
      if (!isNaN(d.getTime())) dateString = d.toLocaleString('vi-VN');
    } catch(e){}

    const reportHtml = `
      <html>
      <head>
        <title>Bao Cao KCS - ${selectedLog.product_type}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; background: #f8fafc; color: #1e293b; line-height: 1.5; }
          .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
          .brand { color: #10b981; font-weight: 900; font-size: 24px; }
          .meta { text-align: right; font-size: 14px; color: #64748b; }
          h2 { color: #0f172a; margin: 0 0 10px 0; font-size: 20px; text-transform: uppercase; }
          .section-title { font-weight: bold; font-size: 16px; margin: 30px 0 15px 0; color: #10b981; display: flex; align-items: center; }
          .section-title::before { content: ""; display: inline-block; width: 4px; height: 18px; background: #10b981; margin-right: 10px; border-radius: 2px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; font-size: 13px; }
          th { background: #f8fafc; color: #64748b; font-weight: bold; }
          .grid-table th { background: #10b981; color: white; text-align: center; font-size: 10px; }
          .grid-table td { text-align: center; font-size: 10px; padding: 6px; }
          .temp-pv { font-weight: bold; color: #0f172a; }
          .temp-sv { color: #94a3b8; font-size: 11px; margin-left: 4px; }
          .print-btn { position: fixed; bottom: 30px; right: 30px; background: #10b981; color: white; border: none; padding: 15px 30px; border-radius: 50px; cursor: pointer; font-weight: bold; box-shadow: 0 10px 15px -3px rgba(16,185,129,0.4); }
          @media print { .print-btn { display: none; } body { padding: 0; background: white; } .container { box-shadow: none; border: none; width: 100%; max-width: 100%; } }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print()">BẤM ĐỂ IN HOẶC LƯU PDF</button>
        <div class="container">
          <div class="header">
            <div>
              <div class="brand">PHƯƠNG NAM SMART KCS AI</div>
              <h2>BÁO CÁO KIỂM TRA CHẤT LƯỢNG</h2>
            </div>
            <div class="meta">
              <div><b>Mã mẻ:</b> ${selectedLog.batch_code || '---'}</div>
              <div><b>Thời gian:</b> ${dateString}</div>
              <div><b>Loại lò:</b> ${kilnType}</div>
              <div><b>Dây chuyền:</b> ${labInfo?.dayChuyen || kilnData.metadata?.dayChuyen || '---'}</div>
            </div>
          </div>

          ${sectionsHtml}
          
          <div style="margin-top: 50px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px;">
            Báo cáo được tạo tự động bởi Hệ thống KCS Thông minh Phương Nam
          </div>
        </div>
      </body>
      </html>
    `;
    newWin.document.write(reportHtml);
    newWin.document.close();

  } catch (error) {
    console.error("PDF Export Error:", error);
    alert("Có lỗi xảy ra khi tạo báo cáo PDF: " + error.message);
  }
};
