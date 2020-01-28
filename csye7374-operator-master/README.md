## CSYE7374 Operator 

The following workflow is for a new Go operator:

Before proceeding, we need to create a directory in our Go workspace that matches our organization’s (or user’s) repositories’ home.

```
$ mkdir -p $GOPATH/src/github.com/pankajsahani
```

The next step is to initialize our operator project using Operator SDK:

```
$ cd $GOPATH/src/github.com/pankajsahani
$ operator-sdk new csye7374-operator
$ cd csye7374-operator
```

As the cluster is running and your credentials are stored in ~/.kube/config, we are ready to try the operator.

Check the cluster availability

```
$ kubectl get nodes
```

First start your minikube using the following command:

```
$ minikube start
```

Now we are ready to deploy the operator to the cluster. The following commands install the CRD, configure permissions needed for our controller to access Kubernetes API from inside the cluster, and deploy the operator.

```
$ kubectl apply -f deploy/crds/app.example.com_folders_crd.yaml
$ kubectl apply -f deploy/service_account.yaml
$ kubectl apply -f deploy/role.yaml
$ kubectl apply -f deploy/role_binding.yaml
$ kubectl apply -f deploy/operator.yaml
```


The following command install the custom resource in the cluster and run the controller locally, in your computer:

```
$ operator-sdk up local
```

For adding a new sub-user, we need to edit the "kubectl apply -f app.example.com_v1alpha1_folder_cr.yaml" file with username field and apply this file again on a separate terminal window

```
$ kubectl apply -f app.example.com_v1alpha1_folder_cr.yaml
```









## Creating Helm Chart:


1. First start your minikube using the following command:

```
$ minikube start
```

2. Install The Helm Command Line Tool

Run the following command on the CLI to install Helm

```
$ brew install kubernetes-helm
```

3. Run Helm Create, Use this command to create a new chart named "csye7374-operator" in a new directory:

```
$ helm create csye7374-operator
```

4. Now we are ready to deploy the operator to the cluster. The following commands install the CRD, configure permissions needed for our controller to access Kubernetes API from inside the cluster, and deploy the operator.

```
$ kubectl apply -f deploy/crds/app.example.com_folders_crd.yaml
```

5. Deploying the Helm Chart, Let’s go ahead and deploy our NGINX chart using the helm install command:


```
$ helm install ./csye7374-operator --name csye7374-operator
```

6. Now copy the new pod-name that's generated through helm and run the following command to get the logs of this pod:

```
kubectl logs pod-name
```

7. For adding a new sub-user, we need to edit the "kubectl apply -f app.example.com_v1alpha1_folder_cr.yaml" file with username field and apply this file again on a separate terminal window

```
$ kubectl apply -f app.example.com_v1alpha1_folder_cr.yaml
```

and then follow by checking the logs of your pod:

```
kubectl logs pod-name
```

## To Delete already running Helm chart

1. Purge the above created chart

```
$ helm del --purge csye7374-operator
```

2. Delete all the resources created in your resources:

```
$ kubectl delete all -n default --all
```

-----------------------------------------------------------------------------------------------------------------------------



