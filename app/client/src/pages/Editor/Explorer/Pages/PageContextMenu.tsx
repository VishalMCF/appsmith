import React, { ReactNode, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import TreeDropdown, {
  TreeDropdownOption,
} from "pages/Editor/Explorer/TreeDropdown";
import { noop } from "lodash";
import ContextMenuTrigger from "../ContextMenuTrigger";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { ContextMenuPopoverModifiers } from "../helpers";
import { initExplorerEntityNameEdit } from "actions/explorerActions";
import {
  clonePageInit,
  deletePage,
  setPageAsDefault,
  updatePage,
} from "actions/pageActions";
import styled from "styled-components";
import { Icon } from "@blueprintjs/core";
import {
  CONTEXT_EDIT_NAME,
  CONTEXT_CLONE,
  CONTEXT_SET_AS_HOME_PAGE,
  CONTEXT_DELETE,
  CONFIRM_CONTEXT_DELETE,
  createMessage,
} from "@appsmith/constants/messages";
import {
  hasDeletePagePermission,
  hasManagePagePermission,
} from "@appsmith/utils/permissionHelpers";
import { getPageById } from "selectors/editorSelectors";

const CustomLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export function PageContextMenu(props: {
  pageId: string;
  name: string;
  applicationId: string;
  className?: string;
  isDefaultPage: boolean;
  isHidden: boolean;
}) {
  const dispatch = useDispatch();
  const [confirmDelete, setConfirmDelete] = useState(false);

  /**
   * delete the page
   *
   * @return void
   */
  const deletePageCallback = useCallback((): void => {
    dispatch(deletePage(props.pageId));
    AnalyticsUtil.logEvent("DELETE_PAGE", {
      pageName: props.name,
    });
  }, [dispatch]);

  /**
   * sets the page as default
   *
   * @return void
   */
  const setPageAsDefaultCallback = useCallback((): void => {
    dispatch(setPageAsDefault(props.pageId, props.applicationId));
  }, [dispatch]);

  /**
   * edit the page name
   *
   * @return void
   */
  const editPageName = useCallback(
    () => dispatch(initExplorerEntityNameEdit(props.pageId)),
    [dispatch, props.pageId],
  );

  /**
   * clone the page
   *
   * @return void
   */
  const clonePage = useCallback(() => dispatch(clonePageInit(props.pageId)), [
    dispatch,
    props.pageId,
  ]);

  /**
   * sets the page hidden
   *
   * @return void
   */
  const setHiddenField = useCallback(
    () => dispatch(updatePage(props.pageId, props.name, !props.isHidden)),
    [dispatch, props.pageId, props.name, props.isHidden],
  );

  const pagePermissions =
    useSelector(getPageById(props.pageId))?.userPermissions || [];

  const canManagePages = hasManagePagePermission(pagePermissions);

  const canDeletePages = hasDeletePagePermission(pagePermissions);

  const optionsTree = [
    canManagePages && {
      value: "rename",
      onSelect: editPageName,
      label: createMessage(CONTEXT_EDIT_NAME),
    },
    canManagePages && {
      value: "clone",
      onSelect: clonePage,
      label: createMessage(CONTEXT_CLONE),
    },
    canManagePages && {
      value: "visibility",
      onSelect: setHiddenField,
      // Possibly support ReactNode in TreeOption
      label: ((
        <CustomLabel>
          {props.isHidden ? "Show" : "Hide"}
          <Icon icon={props.isHidden ? "eye-open" : "eye-off"} iconSize={14} />
        </CustomLabel>
      ) as ReactNode) as string,
    },
    !props.isDefaultPage &&
      canDeletePages && {
        className: "t--apiFormDeleteBtn single-select",
        confirmDelete: confirmDelete,
        value: "delete",
        onSelect: () => {
          confirmDelete ? deletePageCallback() : setConfirmDelete(true);
        },
        label: confirmDelete
          ? createMessage(CONFIRM_CONTEXT_DELETE)
          : createMessage(CONTEXT_DELETE),
        intent: "danger",
      },
    !props.isDefaultPage &&
      canManagePages && {
        value: "setdefault",
        onSelect: setPageAsDefaultCallback,
        label: createMessage(CONTEXT_SET_AS_HOME_PAGE),
      },
  ].filter(Boolean);

  return optionsTree?.length > 0 ? (
    <TreeDropdown
      className={props.className}
      defaultText=""
      modifiers={ContextMenuPopoverModifiers}
      onSelect={noop}
      optionTree={optionsTree as TreeDropdownOption[]}
      selectedValue=""
      setConfirmDelete={setConfirmDelete}
      toggle={<ContextMenuTrigger className="t--context-menu" />}
    />
  ) : null;
}

export default PageContextMenu;
