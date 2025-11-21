import React from "react";
import "./ListHeader.scss";

interface Props {
  title: string;
  description?: string;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  showCreate?: boolean;
  createLabel?: string;
  onCreate?: () => void;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
}

const ListHeader = ({
  title,
  description,
  searchValue,
  onSearchChange,
  showCreate,
  createLabel,
  onCreate,
  leftSlot,
  rightSlot,
}: Props) => {
  return (
    <div className="list-header">
      <div className="list-header-content">
        <div className="list-header-left">{leftSlot}</div>

        <div className="list-header-center">
          <div className="list-header-title">
            <h1>{title}</h1>
            {description && <p className="list-header-description">{description}</p>}
          </div>

          {typeof onSearchChange === "function" && (
            <input
              className="list-header-search"
              type="text"
              placeholder={`Nach ${title} suchen...`}
              value={searchValue ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          )}
        </div>

        <div className="list-header-right">
          {rightSlot}
          {showCreate && onCreate && (
            <button className="list-header-create" onClick={onCreate}>
              {createLabel ?? `+ Neu`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListHeader;
