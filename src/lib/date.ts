function isYesterday(date: Date) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const dateWithoutTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const inputDate = dateWithoutTime(date);
  const yesterdaysDate = dateWithoutTime(yesterday);

  return inputDate.getTime() === yesterdaysDate.getTime();
}

function isToday(date: Date) {
  const today = new Date();

  const dateWithoutTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const inputDate = dateWithoutTime(date);
  const todayDate = dateWithoutTime(today);

  return inputDate.getTime() === todayDate.getTime();
}

// calculcate relative time from now
// if is today => Today + hh::mm::ss
// if is Yesterday => Yesterday + hh::mm::ss
// Else => dd/mm/yyyy hh::mm::ss
export function formatPretyDate(date?: Date | string): string {
    if (!date) {
      return "";
    }
    if (typeof date === "string") {
      date = new Date(date);
    }
    if (isToday(date)) {
        return `Today, ${date.toLocaleTimeString('en-GB', { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: "short" })}`;
    } else if (isYesterday(date)) {
      return `Yesterday, ${date.toLocaleTimeString('en-GB', { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit", timeZoneName: "short" })}`;
    } else {
      return date.toLocaleString('en-GB', { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit", year: "2-digit", month: "2-digit", day: "2-digit", timeZoneName: "short" });
    }
  }
  