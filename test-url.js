let viewUrl = "https://namwpwyjwzruaagwfoox.supabase.co/storage/v1/object/public/iso-documents/KB_B_1777777656603_6.docx";

if (viewUrl.match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/i)) {
    viewUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(viewUrl)}`;
}
console.log(viewUrl);
