import React from "react";
import { LuTrash2 } from "react-icons/lu";
import { getInitials } from "../../utils/helper";

const SummaryCard = ({
  colors,
  role,
  topicsToFocus,
  experience,
  questions,
  description,
  lastUpdated,
  onSelect,
  onDelete,
}) => {
  return (
    <div
      className="bg-white border border-gray-300/40 rounded-xl p-2 overflow-hidden cursor-pointer hover:shadow-xl shadow-gray-100 relative group"
      onClick={onSelect}
    >
      <div
        className="rounded-lg p-4 relative"
        style={{ background: colors.bgcolor }}
      >
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white rounded-md flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-semibold text-black">{getInitials(role)}</span>
          </div>

          <div className="flex-1">
            <h2 className="text-[17px] font-semibold text-black">{role}</h2>

            <p className="text-xs text-gray-600 mt-1">{topicsToFocus}</p>
          </div>

          <button
            className="hidden group-hover:flex items-center gap-2 text-xs text-rose-500 font-medium bg-rose-50 px-3 py-1 rounded whitespace-nowrap border border-rose-100 hover:border-rose-200"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <LuTrash2 />
          </button>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-3 mt-5">
          <div className="text-[10px] font-medium text-black px-3 py-1 border border-gray-300 rounded-full">
            Experience: {experience} {experience === 1 ? "Year" : "Years"}
          </div>

          <div className="text-[10px] font-medium text-black px-3 py-1 border border-gray-300 rounded-full">
            {questions} Q&A
          </div>

          <div className="text-[10px] font-medium text-black px-3 py-1 border border-gray-300 rounded-full">
            Last Updated: {lastUpdated}
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-500 mt-4 line-clamp-2">{description}</p>
      </div>
    </div>
  );
};

export default SummaryCard;
