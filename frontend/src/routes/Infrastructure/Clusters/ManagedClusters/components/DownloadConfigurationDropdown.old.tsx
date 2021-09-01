/* Copyright Contributors to the Open Cluster Management project */

import { Cluster, ClusterStatus, createDownloadFile } from '../../../../../resources'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockBadRequestStatus, nockGet } from '../../../../../lib/nock-util'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { DownloadConfigurationDropdown } from './DownloadConfigurationDropdown'

jest.mock('../../../../../lib/utils', () => ({
    createDownloadFile: jest.fn(),
}))

const mockCluster: Cluster = {
    name: 'test-cluster',
    displayName: 'test-cluster',
    namespace: 'test-cluster',
    status: ClusterStatus.ready,
    distribution: {
        k8sVersion: '1.19',
        ocp: {
            version: '4.6',
            availableUpdates: [],
            desiredVersion: '4.6',
            upgradeFailed: false,
        },
        displayVersion: '4.6',
        isManagedOpenShift: false,
    },
    labels: undefined,
    nodes: undefined,
    kubeApiServer: '',
    consoleURL: '',
    hive: {
        isHibernatable: true,
        clusterPool: undefined,
        secrets: {
            installConfig: 'test-cluster-install-config',
            kubeadmin: 'test-cluster-0-fk6c9-admin-password',
            kubeconfig: 'test-cluster-0-fk6c9-admin-kubeconfig',
        },
    },
    isHive: true,
    isManaged: true,
    isCurator: false,
    owner: {},
}

const mockInstallConfig = {
    kind: 'Secret',
    apiVersion: 'v1',
    metadata: {
        name: 'test-cluster-install-config',
        namespace: 'test-cluster',
        selfLink: '/api/v1/namespaces/test-cluster/secrets/test-cluster-install-config',
        uid: '9b73a4b6-6001-4e78-aea6-70937cf3284b',
        resourceVersion: '54086664',
    },
    data: {
        'install-config.yaml':
            'YXBpVmVyc2lvbjogdjEKbWV0YWRhdGE6CiAgbmFtZTogc3dlaW1lci10ZXN0CmJhc2VEb21haW46IGRldjAyLnJlZC1jaGVzdGVyZmllbGQuY29tCmNvbnRyb2xQbGFuZToKICBoeXBlcnRocmVhZGluZzogRW5hYmxlZAogIG5hbWU6IG1hc3RlcgogIHJlcGxpY2FzOiAzCiAgcGxhdGZvcm06CiAgICBhd3M6CiAgICAgIHJvb3RWb2x1bWU6CiAgICAgICAgaW9wczogNDAwMAogICAgICAgIHNpemU6IDEwMAogICAgICAgIHR5cGU6IGlvMQogICAgICB0eXBlOiBtNS54bGFyZ2UKY29tcHV0ZToKLSBoeXBlcnRocmVhZGluZzogRW5hYmxlZAogIG5hbWU6IHdvcmtlcgogIHJlcGxpY2FzOiAzCiAgcGxhdGZvcm06CiAgICBhd3M6CiAgICAgIHJvb3RWb2x1bWU6CiAgICAgICAgaW9wczogMjAwMAogICAgICAgIHNpemU6IDEwMAogICAgICAgIHR5cGU6IGlvMQogICAgICB0eXBlOiBtNS54bGFyZ2UKbmV0d29ya2luZzoKICBjbHVzdGVyTmV0d29yazoKICAtIGNpZHI6IDEwLjEyOC4wLjAvMTQKICAgIGhvc3RQcmVmaXg6IDIzCiAgbWFjaGluZUNJRFI6IDEwLjAuMC4wLzE2CiAgbmV0d29ya1R5cGU6IE9WTkt1YmVybmV0ZXMKICBzZXJ2aWNlTmV0d29yazoKICAtIDE3Mi4zMC4wLjAvMTYKcGxhdGZvcm06CiAgYXdzOgogICAgcmVnaW9uOiB1cy1lYXN0LTEKcHVsbFNlY3JldDogIiIgIyBza2lwLCBoaXZlIHdpbGwgaW5qZWN0IGJhc2VkIG9uIGl0J3Mgc2VjcmV0cwpzc2hLZXk6IHwtCiAgICBzc2gtcnNhIEFBQUFCM056YUMxeWMyRUFBQUFEQVFBQkFBQUNBUURXZklWbzFCUXJQcGRxRHBPTHNSbjRNVmJtZ1NrQjJQaFA3U1pIdTZaVGtGaFh0Wk5TV2plalVQNDJLU29jREhlNmJUbXVtUnFObE1hcmFzMi84M2hNbXBwSUd5aHIxbGp1TTltNjJHWDVZRHhrT1Bhb2pNME5UU0Ftc3FVUTJXZWVuT2Vkd0JibjZmd3ppWnIyMmViSUN6cXp6bGhxajhVcXdGeU1KSVVobUtVbnBweUMxYWU2eGdZNTlkY2E2UmdLdEZPZFdwUm5pZkJqdjlHTE1qWXVsQXU2d0o2QVpxeXEwNXY3R0ljMVRxZDNEeDhBL2NsUkt2WmUveGJHQmQxNy9Mc3U5WDFrUy85eCtRaExmNlliTlZIZlc2aUhqaXBoUjVaZzlGVFN3eVZMR094cnRmc3cyWHh0bmlJenA3WVdMMW9ySjk5VVZHM3RicjRpUWhRYmZpV2kyYkUya281U3hRSVU1UDVsUVlpY0JVY202d0dZdnplM3lTalJQQUgzRkVYRTVnS0g1NTd4TUVoYzQ1SzNEWEVkTmU1SVpjL2l1SkN2cy81RkwycEJyUEVvVXI3ZmtQd0NZYkJCSk1EeE1QL3RhZkVwZjM5cmJvZXRKMHNqTHhSQU1BakRvZ0V2Qm1MbUk3WE41V0RCbWJQWStIU1hET0pZbFdrSE1EMWkrY3hHeGtTaUZzcGNwZjlYcHNKanlJNURhNExlY1lxSGViYVZLZVdVeFU4cnhvaVNQMnV6dzB5cWhJbzFzVVc5M0VKM21INitwWHVFR3o2Y1FKWUorb05QM1BhUkZJeTBELzZ2RXhBMERNS282NmsyMHZrQzhHelZ5RVhaM3pUSFF6OVFCa1RVd0RyYXI3Y0c5NWY2ZU92OXFYeTJxTGlESlVQbTRiWjJkUT09IFVTMkoyNzg3QGlibS5jb20K',
    },
    type: 'Opaque',
}

const mockKubeconfig = {
    kind: 'Secret',
    apiVersion: 'v1',
    metadata: {
        name: 'test-cluster-0-fk6c9-admin-kubeconfig',
        namespace: 'test-cluster',
        selfLink: '/api/v1/namespaces/test-cluster/secrets/test-cluster-0-fk6c9-admin-kubeconfig',
        uid: '1494964a-8d7c-4a5a-b295-e501698e6eb4',
        resourceVersion: '54130006',
        labels: {
            'hive.openshift.io/cluster-deployment-name': 'test-cluster',
            'hive.openshift.io/cluster-provision-name': 'test-cluster-0-fk6c9',
            'hive.openshift.io/secret-type': 'kubeconfig',
        },
    },
    data: {
        kubeconfig:
            'Y2x1c3RlcnM6Ci0gY2x1c3RlcjoKICAgIGNlcnRpZmljYXRlLWF1dGhvcml0eS1kYXRhOiBMUzB0TFMxQ1JVZEpUaUJEUlZKVVNVWkpRMEZVUlMwdExTMHRDazFKU1VSUlJFTkRRV2xwWjBGM1NVSkJaMGxKWWxkVGFtTllOek5PTTNkM1JGRlpTa3R2V2tsb2RtTk9RVkZGVEVKUlFYZFFha1ZUVFVKQlIwRXhWVVVLUTNoTlNtSXpRbXhpYms1dllWZGFNRTFUWjNkS1oxbEVWbEZSUkVWNE9YSmtWMHBzVEZkR2QyRllUbXhqYmxwc1kya3hjMkl5VG1oaVIyaDJZek5SZEFwak1teHVZbTFXZVUxQ05GaEVWRWwzVFZSSmQwNVVSVFZOUkdjeFRrWnZXRVJVVFhkTlZFbDNUWHBGTlUxRVp6Rk9SbTkzVUdwRlUwMUNRVWRCTVZWRkNrTjRUVXBpTTBKc1ltNU9iMkZYV2pCTlUyZDNTbWRaUkZaUlVVUkZlRGx5WkZkS2JFeFhSbmRoV0U1c1kyNWFiR05wTVhOaU1rNW9Za2RvZG1NelVYUUtZekpzYm1KdFZubE5TVWxDU1dwQlRrSm5hM0ZvYTJsSE9YY3dRa0ZSUlVaQlFVOURRVkU0UVUxSlNVSkRaMHREUVZGRlFYWnBNR3BMZGpBM2RtVTFVQXBOUWxONlJFZDJibk55VUdVeWIxaGFWbkZITjJSMlpsSTFieTl0VEdzd1lYUnJNbEJUVTBaRmQxUnlNWGxsYkU1U2FUTllaeTk0TlVoa1RtOUtLMUVyQ2pOWlpWSjRNalEwU25GWmIxSjZXVmRHY25aMFIyVTNOeTlRVkU1SFVqTkNkbXQ0WW1sMFZtUldSbXQxUWtaNldGUXlWa0V5WkZKT05WZERUMk4xTDBrS1NVaGFVblZIWTJOM2FXZHZaRXBVTURsSU5VVnRXRWx2TkVOQ1NtVk1aMlp5VmsxUmVXb3ljemxvVDFabFJGRlVTV2xzUWtoeFRuaFFTVFp4YW5KM2FRcGhhbkJ1TVRKYVNXbHVPVGwzV0U1MlNFdEpNMk0wYW05UlNuWmhiV05yTkRCUWVtUnhPVmgwYm1SUVpVWlFNbms1VEVGU1RtZDNNbGg1V1hkcVQyUnZDbXhwVHk5WFJVUkplWGR0TmxVd1ZrYzJlWGgwY2twTmVqRnlUV3NyTkdSbVpHRnNSMllyTkZnME5sSXhVRVYyYW10WGRVWlBZV1pzUlhWb2EycDVkM2NLT1V0Wk9YaHVlVU5qVVVsRVFWRkJRbTh3U1hkUlJFRlBRbWRPVmtoUk9FSkJaamhGUWtGTlEwRnhVWGRFZDFsRVZsSXdWRUZSU0M5Q1FWVjNRWGRGUWdvdmVrRmtRbWRPVmtoUk5FVkdaMUZWUlU1NlkyVTVaSFpOVkRoeE9HTnllR00xVmsxR056ZFJLMWMwZDBSUldVcExiMXBKYUhaalRrRlJSVXhDVVVGRUNtZG5SVUpCUW5oU2JuZFdTMGxYUzAxM1pHMTBUMFZFVEd4dE4ybHdVR3BUVkVZek5FTk5WM1kxTm1GdE5IRnVjRk5pZFUxWGRtd3pkbWxyWlVkRFFVY0tZbEpETkVWU1QyOURNMWxuYTFZMFprVkZiVlp2UnpsMFJIY3JZMWxLYVVWS1lYTldTVXRvT0ZCVGFYRldSRk00YVVFclZFcFROVTFNZFV4MVpXZEhaQW80YzFCYU9HZHNSMkpNVmxOTmJtWlpjVTUwVjNGS01IRlpMMjVFYVU5eVQxVldSMk5yTDBzeWMxY3pXVEZVVUhJNU1uVjRjRGxGVUc1VVVVcDVZVXBxQ2toTlQzWm9TalV2SzFCSU1taHRjbU5FSzFCblpsWnNUa1JwVlc4MGRqZHdVMnhVUkhVdlN6bHRSalpwV0U5MVVuTlFSM05SUW1wWloyaFpZMEZUVVd3S1RsbFhlR2RPYUhOT1MzZzFPV1prY0ZScEwwbFRSMnhZZHpsaFZpdEpiekpoVVhaYWRraGlWVWhQYlhaV1UwUTRaSGhXTWt0eUsxbzVWblF4UjNsb1pncHZlakZGVEhsVVJUSkVVWE0yVGxwUGMxYzNjR2hKYUZkblZEZzlDaTB0TFMwdFJVNUVJRU5GVWxSSlJrbERRVlJGTFMwdExTMEtMUzB0TFMxQ1JVZEpUaUJEUlZKVVNVWkpRMEZVUlMwdExTMHRDazFKU1VSVVJFTkRRV3BUWjBGM1NVSkJaMGxKVGprelNtOVJXRkJGT1VWM1JGRlpTa3R2V2tsb2RtTk9RVkZGVEVKUlFYZFNSRVZUVFVKQlIwRXhWVVVLUTNoTlNtSXpRbXhpYms1dllWZGFNRTFUTkhkTVFWbEVWbEZSUkVWNVZuSmtWMHBzVEZkR2QyRllUbXhqYmxwc1kya3hlbHBZU2pKaFYwNXNURmMxYkFwa1NHUjJZMjF6ZEdNeWJHNWliVlo1VFVJMFdFUlVTWGROVkVsM1RsUkZOVTFFWnpGT1JtOVlSRlJOZDAxVVNYZE5la1UxVFVSbk1VNUdiM2RTUkVWVENrMUNRVWRCTVZWRlEzaE5TbUl6UW14aWJrNXZZVmRhTUUxVE5IZE1RVmxFVmxGUlJFVjVWbkprVjBwc1RGZEdkMkZZVG14amJscHNZMmt4ZWxwWVNqSUtZVmRPYkV4WE5XeGtTR1IyWTIxemRHTXliRzVpYlZaNVRVbEpRa2xxUVU1Q1oydHhhR3RwUnpsM01FSkJVVVZHUVVGUFEwRlJPRUZOU1VsQ1EyZExRd3BCVVVWQmMzZzVVRVZET1RWV1VrMURWR0pNUzFSbEt6RllVbEpYVlZCdFNFNDBPRWhYV0hOalVYVnpSa3RTVmtzclYxVTBSazA0SzNsR1MxSlVkRGRVQ2xsWmVuSjNaWGRUY0ZCVFVHMVFhbEl5V1VzMVUyY3lObUV5U3pCNFoxRXphVGRxVDFOdlptaE5Wa0psTjJOdFIwTm5MMlJtTDNkWFYyWlJhWFkwVDFFS1ptOVZNV1J4ZWtOWWMzaFlOMnhSTVhGYWVHMDJkbEJXT1dSMFYwRmlNMWQzVjBadGRYVm1jbnAzWVZGQ1FUQXJValpoYjFob2RWVjZXRTgxUm1aSlZncElSbkZhYTJOMmRrdDFiRFpDYm5FelZ6WTVhMjEyTURBMlpWQkZORWR2TkZsVWJFYzBlVzVIZUhwNmMxSmpiVlF3YzJOc1JFSkthMWxHVGsxYVNFb3pDbE53Y0c5bWVVWnROVGhvY2toSmFGYzVNRlpRUW5oeldrOXJSVnBCUWl0MGIwbHRjekZLZVdac1ZrSlZWM0ZSVWtOSVFtMXVUMGRIV1dSNmJGbDFhVW9LYUdZNGMzQktiWFJDY2pKclVrTkRWbEJOVmxkYWRuQmxTSGRKUkVGUlFVSnZNRWwzVVVSQlQwSm5UbFpJVVRoQ1FXWTRSVUpCVFVOQmNWRjNSSGRaUkFwV1VqQlVRVkZJTDBKQlZYZEJkMFZDTDNwQlpFSm5UbFpJVVRSRlJtZFJWVlpxVG5Oc2RYQTBLMUJtVGtaUGNHRm5abEl5TlVnMmFXZFJUWGRFVVZsS0NrdHZXa2xvZG1OT1FWRkZURUpSUVVSblowVkNRVVJ2YzJKeVlqUjFlRUpTWjJwU1JtUkdka1JUTkVnMmQyUlFXVlZtUjJOaVVsZGhWWEZQTVRnclNWQUtSRVJ4ZUVoNFl6ZEdNM1V4UmxOSE9IQjBPVGhyZGxwSlRXODNhMk42ZDJWTmVVbEJRVkZYUjJSRFF6UmFabHBQYmt4UlNWUllXbFZTVGpsa1FrRjNiUXBEZDNseGFFaHhaU3RUT0ZwWVduQmhSSHBHTmxaTmN6VkhXblkzYVVjNFRqTnhMMFpJZVZCTFVWcHliRGRvTWxwTFFUTjNRekppYVhwUGJEQXZWREUzQ25CblR6RTJOMmxFVkhCclNXdzVVbEZzVDNOeVNVdzBSR1Y1VUdnMlkySjBSRkJFZW5aMUwxbHRibTAxTm5ORlUycDVjWE5vT0M4dlpHOVJWV3hHTTNVS1FqWXpMMFJwYlVSbGJXTkhNemhuVEZsdmRYSkJUWFJYYjJweFVHOXNjbFJZU0daWVNtWm1TbEYzZVZwVWQwZEZlVVo2ZHpGemRuaHJNa1I1VmxkeFp3b3JhVVJwWVdaeE0xTkhkelZJV1d4SWJuVjRNbmR1WmtjM01HbGFTakEwVW1WSllYbHZXVW8xYW1SWlBRb3RMUzB0TFVWT1JDQkRSVkpVU1VaSlEwRlVSUzB0TFMwdENpMHRMUzB0UWtWSFNVNGdRMFZTVkVsR1NVTkJWRVV0TFMwdExRcE5TVWxFVFdwRFEwRm9jV2RCZDBsQ1FXZEpTVUZ1VG5sbWNqQXljekUwZDBSUldVcExiMXBKYUhaalRrRlJSVXhDVVVGM1RucEZVMDFDUVVkQk1WVkZDa040VFVwaU0wSnNZbTVPYjJGWFdqQk5VMFYzU0hkWlJGWlJVVVJGZUdoeVpGZEtiRXhYUm5kaFdFNXNZMjVhYkdOcE1YTlphVEY2WVZka2RWcFlTWGNLU0doalRrMXFRWGhOYWtFeFRWUnJkMDlFVlRGWGFHTk9UWHBCZUUxcVFYcE5WR3QzVDBSVk1WZHFRVE5OVWtsM1JVRlpSRlpSVVV4RmQyeDJZMGRXZFFwak1taHdXbTVSZUVsVVFXWkNaMDVXUWtGTlZFZEhkREZaYlZWMFdWaENjR015Vm5sa2JWWjVURmQ0YVV4WVRuQmFNalZzWTJwRFEwRlRTWGRFVVZsS0NrdHZXa2xvZG1OT1FWRkZRa0pSUVVSblowVlFRVVJEUTBGUmIwTm5aMFZDUVV4UlVIVlZTM0I0Vm10S2FWaDFLMlpaVjNwV05Fb3lRV1ZZVTNJclRIUUtORU52V0RSR2VWbHJNaXMwVGxNME5taGlRelpLWVVWalduTlFXRlJzWmpaWk1HWlVRelZyY3k5VkwwNUxNbXN6WXk5TWFWVkJVMVkwVDIxM1EyNXliUXBKVWl0U01rUkZkM1V6UlRBME1YUlhWVlpDV2k5b05GSnJhbFpDYm5CU2MyNDNSVEZZZFhoTFEzVnZhMEpsVWxadFVUWmtXR0UzVlVGeGVIUlJOVFJ0Q25OS1pUUmljVlJNVGtJeVVYRlhiR3R2YWxWS04ycHJVR1pPTHpCRVNYaFBVR0pSYmpWWmJYTmxibmgzZEVsbllXYzBUaXRZYVRSdVpqSkhZMEZCSzBFS05sRk5jRGs0VFd3eFJETktjV0pITmpkc1NWVm9lU3RuWWtaMGMxRmhSMDE2UWpKNlNYRk5PVkoyYURKNlUyOXdiV0l4YlRocVlYZDNXWEIwUW0xaldRcGlRM1ZMU0dwVFZGazFObVI2ZEhaeU9GSlhkWEJrZW5sWVoxUlllVkZIZW5WVWJtVk1UaXQ2TWt4RlltaHJRMk5GY20xemJ6QkZRMEYzUlVGQllVNURDazFGUVhkRVoxbEVWbEl3VUVGUlNDOUNRVkZFUVdkTGEwMUJPRWRCTVZWa1JYZEZRaTkzVVVaTlFVMUNRV1k0ZDBoUldVUldVakJQUWtKWlJVWkpkM2NLUW1GU1IxWlhOekZrTVdsc1RtSm1aRTl4VVVoSmVpODRUVUV3UjBOVGNVZFRTV0l6UkZGRlFrTjNWVUZCTkVsQ1FWRkJVbGQwTWk5emFHcEJlVTlTYXdvNFYycFBjSEI0VG1kdmJFZHZVMEZLTUVsdFpHbzJlRnBJUVd4RmNrOW9SVTVqVTNsVWRsVnBkRm93UjJKQlRWWkhlbmRCZHk5elZuVllRVmhSY21GSENtY3dhamRRVWpOUU16WlpXV1V2UXpjelRVdGxaV0V2ZWpORVdsWjZNemt5VmtseldHRnNRbTAyVERneVFWcEdNMVUyWWpZeFIyTlZia3M0Y25GRFltUUtObFUzVG5adGRYWTJXV2xxYUhWMGRVdEhUM3BDZEZsM2RFcG1ha0pGVGt3elZYZHZUMlprWkVKUlNXSTNZMWMxZWk5R2JWUkplR3BDY0daNVp6WmllZ280VlhrNEsxQllTWFZFWmpjME5XbzRkRnBNWTNCbFZpOHJSRzgzZFZGblJYTnBjREJuY3pNM2RsZzJhemRMYjJ4cVdEbHhSMlZSY0VsMGNFMU9hbEpRQ2xwekwxbEJTbFpHVXpGTVlUZHNiMDlTWVZvMVFrNUZUVkl5TVRObVFqWk1lVWxTVGpZMVVXVTFjR1ZvV2paSWVFazRhMWgzZWt0dlYwNDVhRVZPUzJrS1pqUXlSRkY2TmtzS0xTMHRMUzFGVGtRZ1EwVlNWRWxHU1VOQlZFVXRMUzB0TFFvPQogICAgc2VydmVyOiBodHRwczovL2FwaS5zd2VpbWVyLXRlc3QuZGV2MDIucmVkLWNoZXN0ZXJmaWVsZC5jb206NjQ0MwogIG5hbWU6IHN3ZWltZXItdGVzdApjb250ZXh0czoKLSBjb250ZXh0OgogICAgY2x1c3Rlcjogc3dlaW1lci10ZXN0CiAgICB1c2VyOiBhZG1pbgogIG5hbWU6IGFkbWluCmN1cnJlbnQtY29udGV4dDogYWRtaW4KcHJlZmVyZW5jZXM6IHt9CnVzZXJzOgotIG5hbWU6IGFkbWluCiAgdXNlcjoKICAgIGNsaWVudC1jZXJ0aWZpY2F0ZS1kYXRhOiBMUzB0TFMxQ1JVZEpUaUJEUlZKVVNVWkpRMEZVUlMwdExTMHRDazFKU1VSYWVrTkRRV3NyWjBGM1NVSkJaMGxKVkcxUFlqVk9TMHRLVVVsM1JGRlpTa3R2V2tsb2RtTk9RVkZGVEVKUlFYZE9ha1ZUVFVKQlIwRXhWVVVLUTNoTlNtSXpRbXhpYms1dllWZGFNRTFUUVhkSVoxbEVWbEZSUkVWNFpHaGFSekZ3WW1reGNtUlhTbXhaTWpsMVdtMXNia3hZVG5CYU1qVnNZMnBCWlFwR2R6QjVUVVJGZVUxRVZYaFBWRUUwVGxST1lVWjNNSHBOUkVWNVRVUk5lRTlVUVRST1ZFNWhUVVJCZUVaNlFWWkNaMDVXUWtGdlZFUnVUalZqTTFKc0NtSlVjSFJaV0U0d1dsaEtlazFTVlhkRmQxbEVWbEZSUkVWM2VIcGxXRTR3V2xjd05sbFhVblJoVnpSM1oyZEZhVTFCTUVkRFUzRkhVMGxpTTBSUlJVSUtRVkZWUVVFMFNVSkVkMEYzWjJkRlMwRnZTVUpCVVVSaFdFMU9aVEE0Y2tSSlRWUkZWVFJSVDJ3ck0wMXFXR2xMUW5FMlVUbENVMVFyVkN0ckx6QTNXQXBNWm1kSFpEbHdSMEZYVlZSblptdFZjbmRwVjFJeUt5dFVaVGwwUlV4T2R6VTRMM2R0TUZSQ1RIazVSM0pxVTFrMlkyMHllVmhhVkVvM2FHWktOSEpuQ205RVZrOXFlR2xzU2pSNFZteEhabkptYjJWak9FVmxhMWhpUnk5cE5FaFljbEpQT1dWdlpFZHZhRmxLYmtveGJUSlVZMk5MWmxacVduTXdNbVZ0Yms4S1JYSnhUbVpQV2trMmFFZE9UM1ZpU1hGWFZXZGFVRWxxWmpOMVpYRlpjMUJCYVZOYVZtY3pPR05oUkZaelZHNVRhVU5xV205bGFtVTBVRGhpZDNGUE5RcDRVVVJ1ZUVWdlFtTlJhbTB6V0hkYWMyVkROVXhJZVhnelRVOUJjMU5OUWpoRFZVNDFUVmREUlZWTE1HNUNjMnhUVWl0SFV6ZEZRa0oyV2tSWlUwSktDbkpaYm5oUlduTnVaWFpWWmpnNFQzQkNURFJFZFZweU5VSnpjRWt2UmtsTmRXZFRlQ3R6VjFkRFoyVmtRV2ROUWtGQlIycG1la0k1VFVFMFIwRXhWV1FLUkhkRlFpOTNVVVZCZDBsR2IwUkJaRUpuVGxaSVUxVkZSbXBCVlVKblozSkNaMFZHUWxGalJFRlJXVWxMZDFsQ1FsRlZTRUYzU1hkRVFWbEVWbEl3VkFwQlVVZ3ZRa0ZKZDBGRVFXUkNaMDVXU0ZFMFJVWm5VVlZTWW01RWNYcDBWblZhUVdJMVNVTkVTRFkyU0VwbmJqVklVVVYzU0hkWlJGWlNNR3BDUW1kM0NrWnZRVlV4UkhOMlJ6UkZNa2R0WjFsWGJFSTJLMDh6YlVzMWVrdENhRWwzUkZGWlNrdHZXa2xvZG1OT1FWRkZURUpSUVVSblowVkNRVUpITkdKaGNVZ0tMMVJoV2tkeVZ6WTNNVU1yY0VkQ1VVeHljbHBzWjJaTk9WZzBTV3hJWmpGdFV6a3plREozY1hKME5taHFXREV5VFhSclVWVnhWM2xwTjNReVQxZHJUQW95ZGxkMk9GTkZhMkZJV2l0TGJpdFVSbXhXYjJkUVJteDJkWEpCV0U0MmNscG1XWFJqSzNORWNuRkdTbTlXVVhORGEyZ3diVmgxUzBOcVpsRlNXbXByQ21kdWVXMVNNbXBMYldsM1FtcHllVVpXYldGMk1IZElRbmRNUkhRMk5YbDNOVXBLWjBFdlZuWnBNMU5IY2sxME1HRldlWGRqVFVGQkswSjBZMU42UlVrS1NrUkpWa05sVW1WSVNsSnJVRVZEVG14MGRIZGFiR05CT1hNMVFqYzBZbEpsTTFFME5tWk1UMkYyY0hWamQwcFhjaXRHVkRFeU5WQlNMMmRDVm5JeU5ncDBVbW93VEdVd1NVd3JaRU5hUW5CVmEybEVhMVZMVGxGdk4wcFdUa3hKUTBaeWJUTTRRVVJFYWtWMVkxbGhVbTg0Y1V0TFJtdE9UamRtYVU5bE9FaE5DbTAwUjIxT2QySjFlWFJLZERrck9EMEtMUzB0TFMxRlRrUWdRMFZTVkVsR1NVTkJWRVV0TFMwdExRbz0KICAgIGNsaWVudC1rZXktZGF0YTogTFMwdExTMUNSVWRKVGlCU1UwRWdVRkpKVmtGVVJTQkxSVmt0TFMwdExRcE5TVWxGY0VGSlFrRkJTME5CVVVWQk1teDZSRmgwVUV0M2VVUkZlRVpQUlVSd1puUjZTVEUwYVdkaGRXdFFVVlZyTDJzdmNGQTVUekY1TXpSQ2JtWmhDbEpuUm14Rk5FZzFSa3M0U1d4clpIWjJhek4yWWxKRGVtTlBabEE0U25SRmQxTTRkbEp4TkRCdFQyNUtkSE5zTWxWNVpUUlllV1ZMTkV0Qk1WUnZPRmtLY0ZObFRWWmFVbTQyTXpaSWJsQkNTSEJHTW5oMk5IVkNNVFl3VkhaWWNVaFNjVWxYUTFwNVpGcDBhek5JUTI0eFdUSmlUazV1Y0hCNmFFczJhbGg2YlFwVFQyOVNhbFJ5YlhsTGJHeEpSMVI1U1RNNU4yNXhiVXhFZDBscmJWWlpUaTlJUjJjeFlrVTFNRzluYnpKaFNHOHpkVVF2UnpoTGFuVmpWVUUxT0ZKTENrRllSVWsxZERFNFIySklaM1ZUZURoelpIcEVaMHhGYWtGbVFXeEVaVlJHWjJoR1EzUktkMkpLVld0bWFHdDFlRUZSWWpKUk1rVm5VMkV5U2poVlIySUtTak55TVVndlVFUnhVVk1yUVRkdFlTdFJZa3RUVUhoVFJFeHZSWE5tY2tac1oyOUlibEZKUkVGUlFVSkJiMGxDUVZGRFlrMVhZV2hXVFVVNE5GZE5Nd3BpVjNacWRURk5Sa2RHTjJSTGJHRlVTM2RaWkVSUU5sRXdLM1JEZGpaalVsbGpheXRESzNVNFlUVnRUbVU0UlUxdVdWUnljV2hTUzFoYU5Vc3hiRnBTQ2xkUGEwdHhMMEppZFdGQmEwNWlVbkJPZEVocU1EZ3dWSGM1VkU5U1RUZGxTVXBIVW1ZMFVXSndjbWRrUWxCYU5VMWpVMXBMZDFsVVluRkZMMjFuUkRNS2JqaG1Xa05aV0VWSGR6QTNaRnBJV0dOSVN6UjZUekUwYkVwUWVVbHphVmxoVkdsUk9GbFFRbEpOVWpkWVRtaFlOUzh6VVRVeU9VTnhNazlUZVdsbFZRcENhVGxGV2pSVU1HZEZTU3MxWm00MWNqTnZiRkpwV0c0M1ZYSlNiSEZyVTI1Rk5tcElNV04zVTBWdE0xUlRibEUyVkdReWRWSmxNMnRUYTFsck1XNUlDbEpNWkdJeWJtTjNlVUZ0VjJSNWVXMTNTR05HWWpSbmFHcHVOamh6ZFhSSU56QjNjek5NVWsxWGVGUnVVV3hCYlROblZuZHhka294YzJWWE5VVlNOM2dLWjFGMVdGbGlNa0pCYjBkQ1FWQXhRbEJoVGtSTGNERjNiQ3RpVTBONGQwSXhObkJyZUVwSlpraHpZVzlWUms0eVlrMU1TWHBYVkdOelluVXdRV2wwVlFwSFZIRnJPVkZvZFVoQk0zZzFWRVZ3YkVWMk4yRnlaM1JtUW1SR1NsTnVNWGRZUkhsUFNYWXdWV3c0UjNKME9VcENiRlZMWld4TGVqTnNPVXhIU0RaRUNtRnRVbXB0ZVZSQlZFOXRSbGxSTUZKUFpsTm9aa0ZvVjFGSWN6bGFTVTVqV21acmFWVTRWME5CWWpkNFYwVk5RM1kzYzNaTllXcE9RVzlIUWtGT2VUWUtjM1Z5YkdFd1ZrVTRWa3BNYVdGSU0xVlpZMDlUS3pkTWQyeHhaa0Z1ZWs1YU1GVkRaM3BsUmxOVlpYRXZha3ROTlhSd1NHZGlTRVZaUmtaMmVUZFFlUXBvYm10VVIzZDFUazVKYWtWTmQwdDJNV013WVdwcmRTOXZhVEpEVm10dGVtRTVLemxRVDFSTVprNVdTa3A2WVdkNE1ESXZZVUZrU0hrd1IyVTBaMFptQ2t4TUt6WlhUM2g2ZVdFeWJHdG9hV3BFVEhKc2RWVkhVSEpMZW1jM2JIWXhVemRNZFM5U2IxSkJiMGRDUVZCR015OXBVVzVwTXpsWU9XOHlkbGxqV2xBS1pqSnNTVGhTTHpseGFVNTVTV3A1YVVseGRFdFBTVkprTlU1Nk5tdHJUSEo1WVRWbWVpODBPSFJ0VlZwaGFGVkpPWGQyU0dGWllUUllObEF3VjNFek5ncFZNMjB3YVdaUWRtWlpXamRaWTNOc00yNU1Ra3hqWVdwR00ya3ljVzFGWlZCb1ppOHpUa2xoZUVoeE0yOU5VMHd3ZWpKTWNIazFkbmh6VmpZd1RscHlDa05DVDFkQ2JHWkJWVXBtVm13dmF6QnhjMm8wUVRWd1ZrRnZSMEZZY0VWdFoyNXFWVWx3VGs1RFRVMVJURzVKTVZoaVYwVldjMU0xWldaWVUweFJTV0lLYTI1a2JraEhlR2RZZGtsc1oybGlXRFpSUkd3d1prZGxhVzlXY0UxeGJHWmlOVkE1TjBVNFRrTlBUakpNTVhGRFRWTlBSbVl6UzFVeWQyRlRWRmhWZGdwaVIxazFTbkJVTHpSTGF6aDNZWHBWWkhKNlozQjFNMlJoVkc1WEwyeDBNbGx3V2tZM2RHZFZkV1UzVEhwMk5XTlFPVFpaU21wNVZqaEhUbFlyT1ZBeUNrbExNQzlvZFVWRFoxbEJablI0UWxKNlEwaFBPRmxqV1RoM1ZqZHhPVWhJVEZFMFdEaGlNMVJIWkM5c2VXZGlhbTl4TmtrMU9XeDRPVmhxVW5KRFIyUUtOaXR3ZERGNU5GSkpia1JyZGs5MlJYaE5WVm9yU1ZreFowRmFiM0kxWTIxcVdrSXdWVEJtWlRCdlNDOUdlbXhuZEUxWlZUaFpRWEpVUjIxUFpYSklTUXBRZDBrdmFIbFpXVlpITjJ4clJIRklVM1JLTlZGcE0zaENSamhEWkhGU09FOTNPVkZFWjIxR09YWjJRWEJzVW1zMlNUZGlhMUU5UFFvdExTMHRMVVZPUkNCU1UwRWdVRkpKVmtGVVJTQkxSVmt0TFMwdExRbz0K',
    },
    type: 'Opaque',
}

describe('DownloadConfigurationDropdown', () => {
    test('renders', () => {
        render(
            <ClusterContext.Provider value={{ cluster: mockCluster, addons: undefined }}>
                <DownloadConfigurationDropdown canGetSecret={true} />
            </ClusterContext.Provider>
        )
        expect(screen.getByTestId('download-configuration')).toBeInTheDocument()
    })
    test('can download the cluster install-config', async () => {
        nockGet(mockInstallConfig)
        render(
            <ClusterContext.Provider value={{ cluster: mockCluster, addons: undefined }}>
                <DownloadConfigurationDropdown canGetSecret={true} />
            </ClusterContext.Provider>
        )
        userEvent.click(screen.getByTestId('download-configuration'))
        await waitFor(() => screen.getByTestId('install-config.yaml'))
        userEvent.click(screen.getByTestId('install-config.yaml'))
        await waitFor(() => expect(createDownloadFile).toHaveBeenCalled())
    })
    test('can download the cluster kubeconfig', async () => {
        nockGet(mockKubeconfig)
        render(
            <ClusterContext.Provider value={{ cluster: mockCluster, addons: undefined }}>
                <DownloadConfigurationDropdown canGetSecret={true} />
            </ClusterContext.Provider>
        )
        userEvent.click(screen.getByTestId('download-configuration'))
        await waitFor(() => screen.getByTestId('kubeconfig'))
        userEvent.click(screen.getByTestId('kubeconfig'))
        await waitFor(() => expect(createDownloadFile).toHaveBeenCalled())
    })
    test('renders null when secrets are not available', () => {
        render(
            <ClusterContext.Provider value={{ cluster: undefined, addons: undefined }}>
                <DownloadConfigurationDropdown canGetSecret={true} />
            </ClusterContext.Provider>
        )
        expect(screen.queryByTestId('download-configuration')).toBeNull()
    })
    test('handles error case', async () => {
        console.error = jest.fn()
        nockGet(mockKubeconfig, mockBadRequestStatus)
        render(
            <ClusterContext.Provider value={{ cluster: mockCluster, addons: undefined }}>
                <DownloadConfigurationDropdown canGetSecret={true} />
            </ClusterContext.Provider>
        )
        userEvent.click(screen.getByTestId('download-configuration'))
        await waitFor(() => screen.getByTestId('kubeconfig'))
        userEvent.click(screen.getByTestId('kubeconfig'))
        await waitFor(() => expect(console.error).toHaveBeenCalled())
    })
})
