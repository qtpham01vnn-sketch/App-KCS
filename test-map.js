const l = {
  kiln_data: {
    nhietDo: "some string instead of array"
  }
};

try {
  const thermal = (l.kiln_data?.nhietDo || l.kiln_data?.filteredModules || []).map(m => `${m.id}:PV=${m.pv}/SV=${m.sv}`).join(", ");
  console.log("Success:", thermal);
} catch(e) {
  console.error("Error:", e.message);
}
