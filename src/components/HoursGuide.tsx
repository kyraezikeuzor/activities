import { Card } from "@omelora/sunrise";


const hourConversions = [
    { activity: "Letters", conversion: "5 letters" },
    {
      activity: "School Supplies",
      conversion: "$20 in supplies",
    },
    { activity: "Books", conversion: "5 books collected" },
    {
      activity: "Education Action Fund",
      conversion: "$30 donated",
    },
  ];
  
  export default function HoursGuide() {
    return (
      <Card className="w-full min-w-0 rounded-xl border-2  bg-white !p-4 h-fit">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Hours Guide
          </h2>
          <p className="mt-1 text-sm leading-5 text-neutral-500">
            See how your contributions count toward
            volunteer hours.
          </p>
        </div>
  
        <div className="mt-4 divide-y divide-gray-100">
            {hourConversions.map(({ activity, conversion }) => (
                <div
                key={activity}
                className="flex items-center justify-between gap-3 py-3"
                >
                <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                    {activity}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                    {conversion}
                    </p>
                </div>

                <span className="shrink-0 text-xs font-medium text-gray-700">
                    = 1 hour
                </span>
                </div>
            ))}
            </div>
      </Card>
    );
  }
  