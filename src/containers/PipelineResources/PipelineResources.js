/*
Copyright 2019 The Tekton Authors
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { Link } from 'react-router-dom';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import { InlineNotification } from 'carbon-components-react';
import { getErrorMessage, urls } from '@tektoncd/dashboard-utils';
import { RunDropdown, Table } from '@tektoncd/dashboard-components';

import { fetchPipelineResources } from '../../actions/pipelineResources';
import { deletePipelineResource } from '../../api';

import {
  getPipelineResources,
  getPipelineResourcesErrorMessage,
  getSelectedNamespace,
  isFetchingPipelineResources,
  isWebSocketConnected
} from '../../reducers';

export /* istanbul ignore next */ class PipelineResources extends Component {
  componentDidMount() {
    this.fetchPipelineResources();
  }

  componentDidUpdate(prevProps) {
    const { namespace, webSocketConnected } = this.props;
    const {
      namespace: prevNamespace,
      webSocketConnected: prevWebSocketConnected
    } = prevProps;

    if (
      namespace !== prevNamespace ||
      (webSocketConnected && prevWebSocketConnected === false)
    ) {
      this.fetchPipelineResources();
    }
  }

  deleteResource = pipelineResource => {
    const { name, namespace } = pipelineResource.metadata;
    deletePipelineResource({ name, namespace });
  };

  pipelineResourceActions = () => {
    const { intl } = this.props;
    return [
      {
        actionText: intl.formatMessage({
          id: 'dashboard.deletePipelineResource.actionText',
          defaultMessage: 'Delete'
        }),
        action: this.deleteResource,
        modalProperties: {
          heading: intl.formatMessage({
            id: 'dashboard.deletePipelineResource.heading',
            defaultMessage: 'Delete PipelineResource'
          }),
          primaryButtonText: intl.formatMessage({
            id: 'dashboard.deletePipelineResource.primaryText',
            defaultMessage: 'Delete PipelineResource'
          }),
          secondaryButtonText: intl.formatMessage({
            id: 'dashboard.modal.cancelButton',
            defaultMessage: 'Cancel'
          }),
          body: resource =>
            intl.formatMessage(
              {
                id: 'dashboard.deletePipelineResource.body',
                defaultMessage:
                  'Are you sure you would like to delete PipelineResource {name}?'
              },
              { name: resource.metadata.name }
            )
        }
      }
    ];
  };

  fetchPipelineResources() {
    const { namespace } = this.props;
    this.props.fetchPipelineResources({
      namespace
    });
  }

  render() {
    const {
      error,
      loading,
      namespace: selectedNamespace,
      pipelineResources,
      intl
    } = this.props;

    const pipelineResourceActions = this.pipelineResourceActions();

    const initialHeaders = [
      {
        key: 'name',
        header: intl.formatMessage({
          id: 'dashboard.tableHeader.name',
          defaultMessage: 'Name'
        })
      },
      {
        key: 'namespace',
        header: intl.formatMessage({
          id: 'dashboard.tableHeader.namespace',
          defaultMessage: 'Namespace'
        })
      },
      {
        key: 'type',
        header: intl.formatMessage({
          id: 'dashboard.tableHeader.type',
          defaultMessage: 'Type'
        })
      },
      {
        key: 'dropdown'
      }
    ];

    const pipelineResourcesFormatted = pipelineResources.map(
      pipelineResource => ({
        id: `${pipelineResource.metadata.namespace}:${
          pipelineResource.metadata.name
        }`,
        name: (
          <Link
            to={urls.pipelineResources.byName({
              namespace: pipelineResource.metadata.namespace,
              pipelineResourceName: pipelineResource.metadata.name
            })}
          >
            {pipelineResource.metadata.name}
          </Link>
        ),
        namespace: pipelineResource.metadata.namespace,
        type: pipelineResource.spec.type,
        dropdown: (
          <RunDropdown
            items={pipelineResourceActions}
            resource={pipelineResource}
          />
        )
      })
    );

    if (error) {
      return (
        <InlineNotification
          kind="error"
          hideCloseButton
          lowContrast
          title="Error loading PipelineResources"
          subtitle={getErrorMessage(error)}
        />
      );
    }

    return (
      <>
        <h1>PipelineResources</h1>
        <Table
          headers={initialHeaders}
          rows={pipelineResourcesFormatted}
          loading={loading}
          selectedNamespace={selectedNamespace}
          emptyTextAllNamespaces={intl.formatMessage(
            {
              id: 'dashboard.emptyState.allNamespaces',
              defaultMessage: 'No {kind} under any namespace.'
            },
            { kind: 'PipelineResources' }
          )}
          emptyTextSelectedNamespace={intl.formatMessage(
            {
              id: 'dashboard.emptyState.selectedNamespace',
              defaultMessage: 'No {kind} under namespace {selectedNamespace}'
            },
            { kind: 'PipelineResources', selectedNamespace }
          )}
        />
      </>
    );
  }
}

/* istanbul ignore next */
function mapStateToProps(state, props) {
  const { namespace: namespaceParam } = props.match.params;
  const namespace = namespaceParam || getSelectedNamespace(state);

  return {
    error: getPipelineResourcesErrorMessage(state),
    loading: isFetchingPipelineResources(state),
    namespace,
    pipelineResources: getPipelineResources(state, { namespace }),
    webSocketConnected: isWebSocketConnected(state)
  };
}

const mapDispatchToProps = {
  fetchPipelineResources
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(injectIntl(PipelineResources));
