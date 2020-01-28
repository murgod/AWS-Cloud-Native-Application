package main

import (
	"context"
	"flag"
	"fmt"
	"os"
	"runtime"
	"encoding/json"

	// Import all Kubernetes client auth plugins (e.g. Azure, GCP, OIDC, etc.)
	_ "k8s.io/client-go/plugin/pkg/client/auth"
	"k8s.io/client-go/rest"

	"github.com/akashbalani/csye7374-operator/pkg/apis"
	"github.com/akashbalani/csye7374-operator/pkg/controller"
	"github.com/akashbalani/csye7374-operator/version"

	"github.com/operator-framework/operator-sdk/pkg/k8sutil"
	kubemetrics "github.com/operator-framework/operator-sdk/pkg/kube-metrics"
	"github.com/operator-framework/operator-sdk/pkg/leader"
	"github.com/operator-framework/operator-sdk/pkg/log/zap"
	"github.com/operator-framework/operator-sdk/pkg/metrics"
	"github.com/operator-framework/operator-sdk/pkg/restmapper"
	sdkVersion "github.com/operator-framework/operator-sdk/version"
	"github.com/spf13/pflag"
	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
	"sigs.k8s.io/controller-runtime/pkg/client/config"
	logf "sigs.k8s.io/controller-runtime/pkg/log"
	"sigs.k8s.io/controller-runtime/pkg/manager"
	"sigs.k8s.io/controller-runtime/pkg/manager/signals"
	appv1alpha1 "github.com/akashbalani/csye7374-operator/pkg/apis/app/v1alpha1"
	// import for aws sdks
	"github.com/aws/aws-sdk-go/aws"
  "github.com/aws/aws-sdk-go/aws/awserr"
  "github.com/aws/aws-sdk-go/aws/session"
  "github.com/aws/aws-sdk-go/service/iam"
	"github.com/aws/aws-sdk-go/service/s3"
)

// Change below variables to serve metrics on different host or port.
var (
	metricsHost               = "0.0.0.0"
	metricsPort         int32 = 8383
	operatorMetricsPort int32 = 8686
)
var log = logf.Log.WithName("cmd")

func printVersion() {
	log.Info(fmt.Sprintf("Operator Version: %s", version.Version))
	log.Info(fmt.Sprintf("Go Version: %s", runtime.Version()))
	log.Info(fmt.Sprintf("Go OS/Arch: %s/%s", runtime.GOOS, runtime.GOARCH))
	log.Info(fmt.Sprintf("Version of operator-sdk: %v", sdkVersion.Version))
//	log.Info(fmt.Sprintf("Version of operator-sdk: %s", appv1alpha1))
}

// PolicyDocument is our definition of our policies to be uploaded to IAM.
type PolicyDocument struct {
    Version   string
    Statement []StatementEntry
}

// StatementEntry will dictate what this policy will allow or not allow.
type StatementEntry struct {
    Effect   string
    Action   []string
    Resource string
}

// spec for user
type UserSpec struct {
	UserName string        `json:"userName"`
}

// function to create IAM user
func createIAMUser() {
	log.Info(fmt.Sprintf("-== Inside createIAMUser ==- "))
	var strPtr *string
	var sptr *string

		// Without the SDK's conversion functions
		str := "goUser"
		strPtr = &str
		s := "arn:aws:iam::786343473782:policy/S3GoUserPolicy"
		sptr = &s

			// go run iam_createuser.go <username>
	    // credentials from the shared credentials file ~/.aws/credentials.
	    sess, err := session.NewSession(&aws.Config{
	        Region: aws.String("us-east-1")},
	    )

	    // Create a IAM service client.
	    svc := iam.New(sess)

	    _, err = svc.GetUser(&iam.GetUserInput{
	        UserName: strPtr,
				})

    if awserr, ok := err.(awserr.Error); ok && awserr.Code() == iam.ErrCodeNoSuchEntityException {
        result, err := svc.CreateUser(&iam.CreateUserInput{
            UserName: strPtr,
						PermissionsBoundary: sptr,
        })

        if err != nil {
            fmt.Println("CreateUser Error", err)
            return
        }

        fmt.Println("Success", result)
    } else {
        fmt.Println("GetUser Error", err)
    }

}

// function to create IAM policy
func createIAMPolicy(){
	sess, err := session.NewSession(&aws.Config{
        Region: aws.String("us-east-1")},
    )

    // Create a IAM service client.
    svc := iam.New(sess)

    // Builds our policy document for IAM.
    policy := PolicyDocument{
        Version: "2012-10-17",
        Statement: []StatementEntry{
            StatementEntry{
                Effect: "Allow",
                Action: []string{
                    "s3:*",
										"s3:Get*", // Allow for creating log groups
                },
                Resource: "*",
            },
            StatementEntry{
                Effect: "Allow",
                // Allows for DeleteItem, GetItem, PutItem, Scan, and UpdateItem
                Action: []string{
                    "dynamodb:DeleteItem",
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:Scan",
                    "dynamodb:UpdateItem",
                },
                Resource: "*",
            },
        },
    }

    b, err := json.Marshal(&policy)
    if err != nil {
        fmt.Println("Error marshaling policy\n", err)
        return
    }

    result, err := svc.CreatePolicy(&iam.CreatePolicyInput{
        PolicyDocument: aws.String(string(b)),
        PolicyName:     aws.String("S3GoUserPolicy"),
    })

    if err != nil {
        fmt.Println("Error", err)
        return
    }

    fmt.Println("New policy", result)
}

// function to create s3 bucket and put object
func createS3Bucket()  {
		var bucketPtr *string
		var keyPtr *string

		bucket := "operator-fall-19"
		bucketPtr = &bucket
    key := "goUser" + "/"
		keyPtr = &key

    // Initialize a session in us-west-2 that the SDK will use to load
    // credentials from the shared credentials file ~/.aws/credentials.
    sess, err := session.NewSession(&aws.Config{
        Region: aws.String("us-west-2")},
    )

    // Create S3 service client
    svc := s3.New(sess)

    _, err = svc.CreateBucket(&s3.CreateBucketInput{
        Bucket: &bucket,
    })
    if err != nil {
        fmt.Println("Failed to create bucket", err)
        return
    }

    if err = svc.WaitUntilBucketExists(&s3.HeadBucketInput{Bucket: &bucket}); err != nil {
        fmt.Println("Failed to wait for bucket to exist %s, %s\n", bucket, err)
        return
    }

    _, err = svc.PutObject(&s3.PutObjectInput{
        Bucket: bucketPtr,
        Key:    keyPtr,
    })
    if err != nil {
        fmt.Println("Failed to upload data to %s/%s, %s\n", bucket, key, err)
        return
    }

    fmt.Println("Successfully created bucket %s and uploaded data with key %s\n", bucket, key)
}

// function to parse custom resource from yaml
func parseCRyaml(cr *appv1alpha1.Folder)  {
	fmt.Println( " printing cr: %s", string(cr.Spec.Username))

}
func CreateFolderDeployment(cr *appv1alpha1.Folder) {
//        log.Info(fmt.Sprintf("Username of CRD *********: %v", cr.Spec.username))

}

func main() {
	// Add the zap logger flag set to the CLI. The flag set must
	// be added before calling pflag.Parse().
	pflag.CommandLine.AddFlagSet(zap.FlagSet())

	// Add flags registered by imported packages (e.g. glog and
	// controller-runtime)
	pflag.CommandLine.AddGoFlagSet(flag.CommandLine)

	pflag.Parse()

	// Use a zap logr.Logger implementation. If none of the zap
	// flags are configured (or if the zap flag set is not being
	// used), this defaults to a production zap logger.
	//
	// The logger instantiated here can be changed to any logger
	// implementing the logr.Logger interface. This logger will
	// be propagated through the whole operator, generating
	// uniform and structured logs.
	logf.SetLogger(zap.Logger())

	printVersion()


	log.Info(fmt.Sprintf("-======== creating IAM Policy =========-  "))
	//createIAMPolicy()
	log.Info(fmt.Sprintf("-======== creating IAM User =========-  "))
	//createIAMUser()
	log.Info(fmt.Sprintf("-======== creating S3 bucket =========-  "))
	//createS3Bucket()

	instance := &appv1alpha1.Folder{}
	parseCRyaml(instance)



  namespace, err := k8sutil.GetWatchNamespace()
	fmt.Println("********  GetWatchNamespace() result ***************************")
	fmt.Println(namespace)

	if err != nil {
		log.Error(err, "Failed to get watch namespace")
		os.Exit(1)
	}

	// Get a config to talk to the apiserver
	cfg, err := config.GetConfig()
	if err != nil {
		log.Error(err, "")
		os.Exit(1)
	}

	ctx := context.TODO()
	// Become the leader before proceeding
	err = leader.Become(ctx, "csye7374-operator-lock")
	if err != nil {
		log.Error(err, "")
		os.Exit(1)
	}

	// Create a new Cmd to provide shared dependencies and start components
	mgr, err := manager.New(cfg, manager.Options{
		Namespace:          namespace,
		MapperProvider:     restmapper.NewDynamicRESTMapper,
		MetricsBindAddress: fmt.Sprintf("%s:%d", metricsHost, metricsPort),
	})
	if err != nil {
		log.Error(err, "")
		os.Exit(1)
	}

	log.Info("Registering Components.")

	// Setup Scheme for all resources
	if err := apis.AddToScheme(mgr.GetScheme()); err != nil {
		log.Error(err, "")
		os.Exit(1)
	}

	// Setup all Controllers
	if err := controller.AddToManager(mgr); err != nil {
		log.Error(err, "")
		os.Exit(1)
	}

	if err = serveCRMetrics(cfg); err != nil {
		log.Info("Could not generate and serve custom resource metrics", "error", err.Error())
	}

	// Add to the below struct any other metrics ports you want to expose.
	servicePorts := []v1.ServicePort{
		{Port: metricsPort, Name: metrics.OperatorPortName, Protocol: v1.ProtocolTCP, TargetPort: intstr.IntOrString{Type: intstr.Int, IntVal: metricsPort}},
		{Port: operatorMetricsPort, Name: metrics.CRPortName, Protocol: v1.ProtocolTCP, TargetPort: intstr.IntOrString{Type: intstr.Int, IntVal: operatorMetricsPort}},
	}
	// Create Service object to expose the metrics port(s).
	service, err := metrics.CreateMetricsService(ctx, cfg, servicePorts)
	if err != nil {
		log.Info("Could not create metrics Service", "error", err.Error())
	}

	// CreateServiceMonitors will automatically create the prometheus-operator ServiceMonitor resources
	// necessary to configure Prometheus to scrape metrics from this operator.
	services := []*v1.Service{service}
	_, err = metrics.CreateServiceMonitors(cfg, namespace, services)
	if err != nil {
		log.Info("Could not create ServiceMonitor object", "error", err.Error())
		// If this operator is deployed to a cluster without the prometheus-operator running, it will return
		// ErrServiceMonitorNotPresent, which can be used to safely skip ServiceMonitor creation.
		if err == metrics.ErrServiceMonitorNotPresent {
			log.Info("Install prometheus-operator in your cluster to create ServiceMonitor objects", "error", err.Error())
		}
	}

	log.Info("Starting the Cmd.")

	// Start the Cmd
	if err := mgr.Start(signals.SetupSignalHandler()); err != nil {
		log.Error(err, "Manager exited non-zero")
		os.Exit(1)
	}
}

// serveCRMetrics gets the Operator/CustomResource GVKs and generates metrics based on those types.
// It serves those metrics on "http://metricsHost:operatorMetricsPort".
func serveCRMetrics(cfg *rest.Config) error {
	// Below function returns filtered operator/CustomResource specific GVKs.
	// For more control override the below GVK list with your own custom logic.
	filteredGVK, err := k8sutil.GetGVKsFromAddToScheme(apis.AddToScheme)
	if err != nil {
		return err
	}
	// Get the namespace the operator is currently deployed in.
	operatorNs, err := k8sutil.GetOperatorNamespace()
	if err != nil {
		return err
	}
	// To generate metrics in other namespaces, add the values below.
	ns := []string{operatorNs}
	// Generate and serve custom resource specific metrics.
	err = kubemetrics.GenerateAndServeCRMetrics(cfg, ns, filteredGVK, metricsHost, operatorMetricsPort)
	if err != nil {
		return err
	}
	return nil
}
